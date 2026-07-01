const db = require("../../../database/models/index");
const LeaveValidationService = require("./leaveValidation.service");
const LeaveBalanceService = require("./leaveBalance.service");
const LeaveAccrualService = require("./leaveAccrual.service");
const LeaveRequestController = require("./leaveRequest.controller");
const { Op } = require("sequelize");

async function runTests() {
    console.log("=== STARTING LEAVE MANAGEMENT MODULE INTEGRATION TESTS ===");
    const results = [];

    // Setup helper to log test results
    const logResult = (testId, scenario, expected, actual, status) => {
        results.push({ testId, scenario, expected, actual, status });
        console.log(`[TEST ${testId}] ${status === 'PASS' ? '✓ PASS' : '✗ FAIL'}: ${scenario}`);
        if (status === 'FAIL') {
            console.log(`  Expected: ${expected}`);
            console.log(`  Actual:   ${actual}`);
        }
    };

    try {
        // Authenticate database
        await db.sequelize.authenticate();

        // 1. Fetch a company and clean mock test records to keep test runs clean
        const company = await db.Company.findOne();
        if (!company) {
            console.error("No company found in seeded database. Run npm run seed first.");
            return;
        }
        const companyId = company.id;

        // Fetch seeded masters
        const employeeTypeId = "OFFICE STAFF";

        const clType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "CL" } });
        const compOffType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "COMP_OFF" } });

        if (!clType || !compOffType) {
            console.error("Required test masters (CL, COMP_OFF) not found. Run seed script.");
            return;
        }

        // Clean any existing test objects
        await db.LeaveRequest.destroy({ where: { reason: { [Op.like]: "%[TEST]%" } } });
        await db.LeaveTransaction.destroy({ where: { description: { [Op.like]: "%[TEST]%" } } });
        await db.LeaveBalance.destroy({ where: { company_id: companyId, leave_year: "2026" } });
        await db.Calender.destroy({ where: { remark: { [Op.like]: "%[TEST]%" } } });

        // Seed mock Calendar entries (Weekly off: Sunday, Holiday: 2026-07-02)
        await db.Calender.create({
            company_id: companyId,
            holiday_type: "WEEKLY",
            week_day: "Sunday",
            year: 2026,
            remark: "[TEST] Sunday Weekly Off"
        });
        await db.Calender.create({
            company_id: companyId,
            holiday_type: "COMPANY",
            holiday_date: "2026-07-02",
            year: 2026,
            remark: "[TEST] July 2nd Company Holiday"
        });

        // Create a test employee
        const mockEmployee = await db.Employee.create({
            company_id: companyId,
            employee_type: "OFFICE STAFF",
            name: "TEST HARNESS EMPLOYEE",
            uan: "999999999999",
            mobile: "9999999999",
            gender: "Male",
            date_of_joining: "2026-07-01",
            ip_number: "9999999999",
            dob: "1990-01-01",
            aadhar: "999999999999",
            status: true
        });
        const employeeId = mockEmployee.id;

        // -------------------------------------------------------------
        // TEST CASE 1: Proration on Employee Joining (Calendar Year type)
        // -------------------------------------------------------------
        // Employee joins on July 1st (Month 7). Yearly CL policy limit is 12 days.
        // Prorated CL should be: 12 * (13 - 7) / 12 = 6.0 days.
        await db.LeavePolicy.update(
            { yearly_allocation: 12.0, monthly_accrual_enabled: false },
            { where: { company_id: companyId, employee_type: employeeTypeId, leave_type_id: clType.id } }
        );
        await company.update({ leave_year_type: "Calendar Year" });

        await LeaveBalanceService.autoAllocateForEmployee(mockEmployee);
        const clBalanceObj = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2026" }
        });

        const allocatedDays = clBalanceObj ? parseFloat(clBalanceObj.allocated) : 0;
        logResult(
            1,
            "Joining Balance Proration (Calendar Year - Joining July 1st, 12 days yearly policy)",
            "6",
            String(allocatedDays),
            allocatedDays === 6.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 2: Sandwich Leave Calculation - Disabled (Skip weekend/holidays)
        // -------------------------------------------------------------
        // Apply leave from Friday 2026-07-03 to Monday 2026-07-06 (Sunday 2026-07-05 is sandwiched weekly off)
        // Since sandwich is disabled, Sunday should not count. Friday, Saturday, Monday are 3 days.
        await company.update({ sandwich_policy_enabled: false });
        let calculatedDays = await LeaveValidationService.calculateLeaveDays(
            companyId,
            "2026-07-03",
            "2026-07-06",
            "Full Day",
            false
        );
        logResult(
            2,
            "Sandwich Leave Count (Policy Disabled - Fri to Mon range)",
            "3",
            String(calculatedDays),
            calculatedDays === 3.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 3: Sandwich Leave Calculation - Enabled (Include weekly offs)
        // -------------------------------------------------------------
        // With sandwich enabled, the sandwiched Sunday is counted as leave. Fri to Mon is 4 days.
        await company.update({ sandwich_policy_enabled: true });
        calculatedDays = await LeaveValidationService.calculateLeaveDays(
            companyId,
            "2026-07-03",
            "2026-07-06",
            "Full Day",
            true
        );
        logResult(
            3,
            "Sandwich Leave Count (Policy Enabled - Fri to Mon range)",
            "4",
            String(calculatedDays),
            calculatedDays === 4.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 4: Leave Overlap Prevention Check
        // -------------------------------------------------------------
        // Create an existing approved leave from 2026-07-10 to 2026-07-12
        await db.LeaveRequest.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: clType.id,
            leave_type: "CL",
            from_date: "2026-07-10",
            to_date: "2026-07-12",
            number_of_days: 3.0,
            day_type: "Full Day",
            reason: "[TEST] Existing Leave",
            status: "Approved",
            applied_date: "2026-07-01"
        });

        let overlapError = null;
        try {
            await LeaveValidationService.validateApplication(companyId, {
                employeeId,
                leaveTypeId: clType.id,
                fromDate: "2026-07-11", // Overlaps
                toDate: "2026-07-15",
                dayType: "Full Day"
            });
        } catch (err) {
            overlapError = err.message;
        }

        logResult(
            4,
            "Leave Overlap Validation (Try applying overlapping dates)",
            "Leave request dates overlap with an existing request.",
            overlapError,
            overlapError && overlapError.includes("overlap") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 5: Remaining Balance Formula & Insufficient Quota
        // -------------------------------------------------------------
        // Employee has 6.0 allocated CL.
        // Try applying for 7.0 days CL. Should fail with insufficient quota error.
        let balanceError = null;
        try {
            await LeaveValidationService.validateApplication(companyId, {
                employeeId,
                leaveTypeId: clType.id,
                fromDate: "2026-07-15",
                toDate: "2026-07-22", // 7.0 working days
                dayType: "Full Day"
            });
        } catch (err) {
            balanceError = err.message;
        }

        logResult(
            5,
            "Insufficient Balance Validation (Apply 7 days CL with 6 days balance)",
            "Insufficient leave balance.",
            balanceError,
            balanceError && balanceError.includes("balance") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 6: Dynamic Comp Off Expiry Ledger Logic
        // -------------------------------------------------------------
        // Company Comp Off expiry is 90 days.
        await company.update({ comp_off_expiry_days: 90 });
        
        // Grant 1: Expired (Grant date 100 days ago)
        const expiredDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
        const expiredTx = await db.LeaveTransaction.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: compOffType.id,
            transaction_type: "Manual Balance Adjustment",
            leave_year: "2026",
            days: 1.0,
            is_paid: true,
            description: "[TEST] Expired Comp Off Grant"
        });
        await db.sequelize.query("UPDATE leave_transactions SET created_at = ? WHERE id = ?", {
            replacements: [expiredDate, expiredTx.id]
        });

        // Grant 2: Active (Grant date 10 days ago)
        const activeDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const activeTx = await db.LeaveTransaction.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: compOffType.id,
            transaction_type: "Manual Balance Adjustment",
            leave_year: "2026",
            days: 2.0,
            is_paid: true,
            description: "[TEST] Active Comp Off Grant"
        });
        await db.sequelize.query("UPDATE leave_transactions SET created_at = ? WHERE id = ?", {
            replacements: [activeDate, activeTx.id]
        });

        // Calculate unexpired Comp Off
        const compOffStats = await LeaveBalanceService.calculateUnexpiredCompOff(companyId, employeeId, compOffType.id);
        logResult(
            6,
            "FIFO Comp Off Expiry Logic (1 day expired, 2 days active, total grants: 3)",
            "2",
            String(compOffStats.available),
            compOffStats.available === 2.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 7: Leave Request Approval Workflow & Attendance Sync
        // -------------------------------------------------------------
        // Create CL request for 2026-07-27 (1 day). Approved it.
        // Used should increase to 1.0. Attendance record for 2026-07-27 should be created with "Paid Leave".
        const request = await db.LeaveRequest.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: clType.id,
            leave_type: "CL",
            from_date: "2026-07-27",
            to_date: "2026-07-27",
            number_of_days: 1.0,
            day_type: "Full Day",
            reason: "[TEST] Holiday Application",
            status: "Submitted",
            applied_date: "2026-07-20"
        });

        // Call controller mock approve
        const reqObj = { params: { id: request.id }, user: { id: "test-admin" } };
        const resObj = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { this.body = data; return this; }
        };
        
        await LeaveRequestController.approve(reqObj, resObj);
        
        const updatedBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        const attendance = await db.Attendance.findOne({
            where: { employee_id: employeeId, date: "2026-07-27" }
        });

        const usedCount = updatedBalance ? parseFloat(updatedBalance.used) : 0;
        const attStatus = attendance ? attendance.attendance_status : null;

        const isApprovePassed = usedCount === 1.0 && attStatus === "Paid Leave";
        logResult(
            7,
            "Approved Leave Workflow (Verify balance deduction & Attendance status)",
            "Used: 1.0, Attendance: Paid Leave",
            `Used: ${usedCount}, Attendance: ${attStatus}`,
            isApprovePassed ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 8: Leave Request Cancellation Workflow & Sync Reversion
        // -------------------------------------------------------------
        // Cancel the approved leave request.
        // Used should revert to 0.0. Attendance record should be removed or set back to regular.
        await LeaveRequestController.cancel(reqObj, resObj);

        const cancelledBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        const revertedAttendance = await db.Attendance.findOne({
            where: { employee_id: employeeId, date: "2026-07-27" }
        });

        const currentUsed = cancelledBalance ? parseFloat(cancelledBalance.used) : 0;
        const currentAtt = revertedAttendance ? revertedAttendance.attendance_status : "Deleted";

        const isCancelPassed = currentUsed === 0.0 && currentAtt === "Deleted";
        logResult(
            8,
            "Cancelled Leave Workflow (Verify balance recovery & Attendance deletion)",
            "Used: 0, Attendance: Attendance entry removed because the approved leave was cancelled.",
            `Used: ${currentUsed}, Attendance: ${currentAtt === "Deleted" ? "Attendance entry removed because the approved leave was cancelled." : currentAtt}`,
            isCancelPassed ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 9: Monthly Accrual Capping Calculation
        // -------------------------------------------------------------
        // Set policy: CL yearly allocation cap is 12 days. Monthly accrual amount = 2.0 days. Accrual enabled = true.
        // Set allocated balance to 11.0 days. Trigger monthly accrual.
        // Allocation should increase to 12.0 days (capped at yearly_allocation), not 13.0 days.
        await db.LeavePolicy.update(
            { yearly_allocation: 12.0, monthly_accrual_enabled: true, monthly_accrual_amount: 2.0 },
            { where: { company_id: companyId, employee_type: employeeTypeId, leave_type_id: clType.id } }
        );
        const balObj = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        await balObj.update({ allocated: 11.0 });

        await LeaveAccrualService.processMonthlyAccrual(companyId, "test-runner");

        const accruedBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        const finalAllocated = accruedBalance ? parseFloat(accruedBalance.allocated) : 0;

        logResult(
            9,
            "Monthly Accrual Allocation Cap (Policy allocation cap: 12 days, incrementing 11 by 2 days)",
            "12",
            String(finalAllocated),
            finalAllocated === 12.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 10: Half-Day Leave Validation & Attendance marking
        // -------------------------------------------------------------
        // Apply half-day leave for CL on 2026-07-29.
        // Duration should be 0.5. Used increases by 0.5. Attendance marked as "Half Day".
        const hdRequest = await db.LeaveRequest.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: clType.id,
            leave_type: "CL",
            from_date: "2026-07-29",
            to_date: "2026-07-29",
            number_of_days: 0.5,
            day_type: "First Half",
            reason: "[TEST] Half day request",
            status: "Submitted",
            applied_date: "2026-07-20"
        });

        // Set clBalance used to 0
        await accruedBalance.update({ used: 0.0 });

        const hdReqObj = { params: { id: hdRequest.id }, user: { id: "test-admin" } };
        await LeaveRequestController.approve(hdReqObj, resObj);

        const hdBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        const hdAttendance = await db.Attendance.findOne({
            where: { employee_id: employeeId, date: "2026-07-29" }
        });

        const hdUsed = hdBalance ? parseFloat(hdBalance.used) : 0;
        const hdAttStatus = hdAttendance ? hdAttendance.attendance_status : null;

        logResult(
            10,
            "Half-Day Leave (0.5 day deduction & Half Day Attendance status)",
            "Used: 0.5, Attendance: Half Day",
            `Used: ${hdUsed}, Attendance: ${hdAttStatus}`,
            (hdUsed === 0.5 && hdAttStatus === "Half Day") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 11: Paid vs. Unpaid Leave behaviors
        // -------------------------------------------------------------
        // Fetch/create LWP leave type. LWP is unpaid (is_paid: false).
        // Approve a 2-day LWP leave. Verify that the paid CL leave balance is untouched,
        // and attendance is marked as "Unpaid Leave".
        const lwpType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "LWP" } });
        const lwpRequest = await db.LeaveRequest.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: lwpType.id,
            leave_type: "LWP",
            from_date: "2026-07-20",
            to_date: "2026-07-21",
            number_of_days: 2.0,
            day_type: "Full Day",
            reason: "[TEST] Unpaid LWP request",
            status: "Submitted",
            applied_date: "2026-07-15"
        });

        // Current CL used count before LWP approve
        const preClUsed = hdBalance ? parseFloat(hdBalance.used) : 0.5;

        const lwpReqObj = { params: { id: lwpRequest.id }, user: { id: "test-admin" } };
        await LeaveRequestController.approve(lwpReqObj, resObj);

        const postClBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id }
        });
        const lwpAttendance = await db.Attendance.findOne({
            where: { employee_id: employeeId, date: "2026-07-20" }
        });

        const postClUsed = postClBalance ? parseFloat(postClBalance.used) : 0;
        const lwpAttStatus = lwpAttendance ? lwpAttendance.attendance_status : null;

        logResult(
            11,
            "Paid vs. Unpaid Leave (Unpaid leave doesn't deduct Paid balance, marks Unpaid Leave)",
            "Paid CL Used unchanged (0.5), Attendance: Unpaid Leave",
            `Paid CL Used: ${postClUsed}, Attendance: ${lwpAttStatus}`,
            (postClUsed === preClUsed && lwpAttStatus === "Unpaid Leave") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 12: Year-End Carry Forward (Allocation=12, Used=8, Limit=3)
        // -------------------------------------------------------------
        // Seed 2025 balance: Allocated = 12.0, Used = 8.0, Carry Forward = 0.
        // Set policy: carry_forward_allowed = true, max_carry_forward = 3.0.
        // Run carry forward to 2026. Carry forward should be Math.min(12-8, 3.0) = 3.0.
        const prevYearBal = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, clType.id, "2025");
        await prevYearBal.update({ allocated: 12.0, used: 8.0, carry_forward: 0.0 });

        await db.LeavePolicy.update(
            { carry_forward_allowed: true, max_carry_forward: 3.0 },
            { where: { company_id: companyId, employee_type: employeeTypeId, leave_type_id: clType.id } }
        );

        // Reset 2026 CL carry forward
        const clBalance2026 = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2026" }
        });
        await clBalance2026.update({ carry_forward: 0.0 });

        await LeaveAccrualService.processYearEndCarryForward(companyId, "2025", "2026", "test-runner");

        const cfBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2026" }
        });
        const cfCount = cfBalance ? parseFloat(cfBalance.carry_forward) : 0;

        logResult(
            12,
            "Year-End Carry Forward (Allocation: 12, Used: 8, CF Max Limit: 3)",
            "3",
            String(cfCount),
            cfCount === 3.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 13: Leave Policy Change Snapshot Integrity
        // -------------------------------------------------------------
        // Policy change should NOT retroactively update already allocated snapshot balances.
        const originalAllocated = cfBalance ? parseFloat(cfBalance.allocated) : 12.0;

        // Change policy yearly_allocation
        await db.LeavePolicy.update(
            { yearly_allocation: 25.0 },
            { where: { company_id: companyId, employee_type: employeeTypeId, leave_type_id: clType.id } }
        );

        const afterPolicyChangeBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2026" }
        });
        const afterPolicyChangeAllocated = afterPolicyChangeBalance ? parseFloat(afterPolicyChangeBalance.allocated) : 0;

        logResult(
            13,
            "Leave Policy Change (Verify policy updates do not affect active yearly balance snapshot)",
            String(originalAllocated),
            String(afterPolicyChangeAllocated),
            afterPolicyChangeAllocated === originalAllocated ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 14: Document Required Validation
        // -------------------------------------------------------------
        // SL requires supporting document. Application without attachment should be rejected.
        const slType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "SL" } });
        await slType.update({ requires_supporting_document: true });

        let docError = null;
        try {
            await LeaveValidationService.validateApplication(companyId, {
                employeeId,
                leaveTypeId: slType.id,
                fromDate: "2026-07-22",
                toDate: "2026-07-23",
                dayType: "Full Day",
                attachmentPath: null // No attachment
            });
        } catch (err) {
            docError = err.message;
        }

        await slType.update({ requires_supporting_document: false }); // Revert

        logResult(
            14,
            "Supporting Document Validation (Apply for SL requiring document, without attachment)",
            "Supporting document is required for applying Sick Leave.",
            docError,
            docError && docError.includes("document") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 15: Inactive Leave Type Filter
        // -------------------------------------------------------------
        // Inactive leave types should not be returned by API or validators.
        await slType.update({ is_active: false });

        let inactiveError = null;
        try {
            await LeaveValidationService.validateApplication(companyId, {
                employeeId,
                leaveTypeId: slType.id,
                fromDate: "2026-07-22",
                toDate: "2026-07-23",
                dayType: "Full Day"
            });
        } catch (err) {
            inactiveError = err.message;
        }

        await slType.update({ is_active: true }); // Revert

        logResult(
            15,
            "Inactive Leave Type Check (Applying for disabled leave type)",
            "Leave type not found or is currently inactive.",
            inactiveError,
            inactiveError && inactiveError.includes("inactive") ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 16: Attendance Rollback Verification
        // -------------------------------------------------------------
        // Re-cancelling LWP request to check attendance restoration.
        await LeaveRequestController.cancel(lwpReqObj, resObj);
        const rolledBackAttendance = await db.Attendance.findOne({
            where: { employee_id: employeeId, date: "2026-07-20" }
        });
        const lwpRollbackAtt = rolledBackAttendance ? rolledBackAttendance.attendance_status : "Deleted";

        logResult(
            16,
            "Attendance Rollback (Verify cancelling restores attendance state)",
            "Attendance entry removed because the approved leave was cancelled.",
            lwpRollbackAtt === "Deleted" ? "Attendance entry removed because the approved leave was cancelled." : lwpRollbackAtt,
            lwpRollbackAtt === "Deleted" ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 17: Multi-Year Carry Forward compounding check (2025 -> 2026 -> 2027 -> 2028)
        // -------------------------------------------------------------
        // Setup CL Policy: Carry forward allowed, limit = 5. Yearly allocation = 10.
        await db.LeavePolicy.update(
            { carry_forward_allowed: true, max_carry_forward: 5.0, yearly_allocation: 10.0 },
            { where: { company_id: companyId, employee_type: employeeTypeId, leave_type_id: clType.id } }
        );

        // Year 2025: Allocated: 10, Used: 2, CF: 0. Remaining = 8.
        const prevBal2025 = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, clType.id, "2025");
        await prevBal2025.update({ allocated: 10.0, used: 2.0, carry_forward: 0.0 });

        // Carry forward to 2026: expected CF = 5 (capped at 5)
        const prevBal2026 = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, clType.id, "2026");
        await prevBal2026.update({ allocated: 10.0, used: 12.0, carry_forward: 0.0 }); // Set used to 12
        await LeaveAccrualService.processYearEndCarryForward(companyId, "2025", "2026", "test-runner");

        // Carry forward to 2027: available 2026 total was 10 + 5 = 15. Used = 12. Remaining = 3.
        // Expected CF for 2027 = 3.
        const prevBal2027 = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, clType.id, "2027");
        await prevBal2027.update({ allocated: 10.0, used: 4.0, carry_forward: 0.0 }); // Set used to 4
        await LeaveAccrualService.processYearEndCarryForward(companyId, "2026", "2027", "test-runner");

        // Carry forward to 2028: available 2027 total was 10 + 3 = 13. Used = 4. Remaining = 9.
        // Expected CF for 2028 = 5 (capped at 5).
        const prevBal2028 = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, clType.id, "2028");
        await prevBal2028.update({ allocated: 10.0, used: 0.0, carry_forward: 0.0 });
        await LeaveAccrualService.processYearEndCarryForward(companyId, "2027", "2028", "test-runner");

        const finalCFBal2028 = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2028" }
        });
        const finalCF2028 = finalCFBal2028 ? parseFloat(finalCFBal2028.carry_forward) : 0;

        logResult(
            17,
            "Multi-Year Carry Forward Compounding Check (2025 -> 2026 -> 2027 -> 2028)",
            "5",
            String(finalCF2028),
            finalCF2028 === 5.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 18: Concurrent Leave Request Submissions
        // -------------------------------------------------------------
        // Employee has Remaining = 2. Submits Request A = 2 days, Request B = 2 days in parallel.
        // Pessimistic Locking ensures only one request succeeds, while the other fails.
        const clBalance2026ForConcurrent = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: clType.id, leave_year: "2026" }
        });
        await clBalance2026ForConcurrent.update({ allocated: 2.0, used: 0.0, carry_forward: 0.0 });

        const reqA = {
            body: {
                employeeId,
                companyId,
                leaveTypeId: clType.id,
                fromDate: "2026-08-03",
                toDate: "2026-08-04", // 2 working days
                dayType: "Full Day",
                reason: "[TEST] Concurrent Request A",
                status: "Submitted"
            }
        };
        const reqB = {
            body: {
                employeeId,
                companyId,
                leaveTypeId: clType.id,
                fromDate: "2026-08-10",
                toDate: "2026-08-11", // 2 working days
                dayType: "Full Day",
                reason: "[TEST] Concurrent Request B",
                status: "Submitted"
            }
        };

        const resA = {
            statusCode: null,
            body: null,
            status: function(c) { this.statusCode = c; return this; },
            json: function(d) { this.body = d; return this; }
        };
        const resB = {
            statusCode: null,
            body: null,
            status: function(c) { this.statusCode = c; return this; },
            json: function(d) { this.body = d; return this; }
        };

        await Promise.allSettled([
            LeaveRequestController.create(reqA, resA),
            LeaveRequestController.create(reqB, resB)
        ]);

        const codes = [resA.statusCode, resB.statusCode];
        const successCount = codes.filter(c => c === 211 || c === 201).length;
        const failCount = codes.filter(c => c === 500 || c === 422).length;

        logResult(
            18,
            "Concurrent Request Balance Verification (2 parallel requests of 2 days with 2 days balance)",
            "1 success, 1 fail",
            `${successCount} success, ${failCount} fail`,
            (successCount === 1 && failCount === 1) ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 19: Maternity Leave Seeding & Application Verification (Paid, Document Required)
        // -------------------------------------------------------------
        // Fetch Maternity Leave (ML) type and policies
        const mlType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "ML" } });
        
        // Seed Maternity Leave balance for this employee for 2026: 180 days allocation
        const mlBalance = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, mlType.id, "2026");
        await mlBalance.update({ allocated: 180.00, used: 0.00 });

        // Apply ML for 10 days. Requires document, so we pass attachment_path.
        const mlReq = await db.LeaveRequest.create({
            company_id: companyId,
            employee_id: employeeId,
            leave_type_id: mlType.id,
            leave_type: "Maternity Leave",
            from_date: "2026-09-01",
            to_date: "2026-09-10",
            number_of_days: 10.0,
            day_type: "Full Day",
            reason: "[TEST] Maternity Leave application",
            status: "Submitted",
            attachment_path: "/uploads/medical_cert.pdf",
            applied_date: "2026-07-20"
        });

        // Approve ML request
        const mlReqObj = { params: { id: mlReq.id }, user: { id: "test-admin" } };
        await LeaveRequestController.approve(mlReqObj, resObj);

        const updatedMlBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: mlType.id, leave_year: "2026" }
        });
        const mlUsed = updatedMlBalance ? parseFloat(updatedMlBalance.used) : 0;

        logResult(
            19,
            "Maternity Leave Seeding & Application (Paid, 180 days limit, requires file upload)",
            "Used: 10",
            `Used: ${mlUsed}`,
            mlUsed === 10.0 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // TEST CASE 20: Paternity Leave non-accrual verification (credited fully, no monthly increment)
        // -------------------------------------------------------------
        const plType = await db.LeaveType.findOne({ where: { company_id: companyId, code: "PL" } });
        const plBalance = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, plType.id, "2026");
        await plBalance.update({ allocated: 15.00, used: 0.00 });

        // Run monthly accrual. Paternity leave shouldn't increment because monthly_accrual_enabled = false
        await LeaveAccrualService.processMonthlyAccrual(companyId, "test-runner");

        const postAccrualPlBalance = await db.LeaveBalance.findOne({
            where: { company_id: companyId, employee_id: employeeId, leave_type_id: plType.id, leave_year: "2026" }
        });
        const plAllocated = postAccrualPlBalance ? parseFloat(postAccrualPlBalance.allocated) : 15;

        logResult(
            20,
            "Paternity Leave Accrual Verification (Fully credited, verify no monthly accrual increments)",
            "15",
            String(plAllocated),
            plAllocated === 15.00 ? "PASS" : "FAIL"
        );

        // -------------------------------------------------------------
        // CLEANUP
        // -------------------------------------------------------------
        await db.LeaveRequest.destroy({ where: { employee_id: employeeId } });
        await db.LeaveTransaction.destroy({ where: { employee_id: employeeId } });
        await db.LeaveBalance.destroy({ where: { employee_id: employeeId } });
        await db.Employee.destroy({ where: { id: employeeId } });
        await db.Calender.destroy({ where: { remark: { [Op.like]: "%[TEST]%" } } });

    } catch (err) {
        console.error("Test execution failed with error:", err);
    } finally {
        // Output test results summary table in CSV format for reference, then terminate db
        console.log("=== TESTS COMPLETED ===");
        console.log(JSON.stringify(results, null, 2));
        await db.sequelize.close();
    }
}

runTests();
