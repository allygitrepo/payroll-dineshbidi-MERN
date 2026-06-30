const db = require("../../../database/models/index");
const LeaveValidationService = require("./leaveValidation.service");
const { Op } = require("sequelize");

class LeaveBalanceService {
    /**
     * Get or create a LeaveBalance record for an employee, leave type and year
     */
    static async getOrCreateBalance(companyId, employeeId, leaveTypeId, leaveYear, transaction = null) {
        let balance = await db.LeaveBalance.findOne({
            where: {
                company_id: companyId,
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
                leave_year: leaveYear
            },
            transaction
        });

        if (!balance) {
            balance = await db.LeaveBalance.create({
                company_id: companyId,
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
                leave_year: leaveYear,
                allocated: 0.00,
                used: 0.00,
                carry_forward: 0.00
            }, { transaction });
        }
        return balance;
    }

    /**
     * Auto-allocate leaves for a newly created employee
     */
    static async autoAllocateForEmployee(employee, targetYear = null) {
        try {
            const { id: employeeId, company_id: companyId, employee_type_id: employeeTypeId, date_of_joining: dojStr } = employee;
            if (!employeeTypeId) return;

            // Fetch global leave configuration to determine year type
            const company = await db.Company.findByPk(companyId);
            const leaveYearType = company ? company.leave_year_type : "Calendar Year";

            // Calculate current leave year string if not explicitly passed
            if (!targetYear) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, "0");
                const dd = String(today.getDate()).padStart(2, "0");
                targetYear = this.getLeaveYearString(`${yyyy}-${mm}-${dd}`, leaveYearType);
            }

            // Fetch active policies for this employee type
            const policies = await db.LeavePolicy.findAll({
                where: {
                    company_id: companyId,
                    employee_type_id: employeeTypeId
                },
                include: [{ model: db.LeaveType, as: "leaveType", where: { is_active: true } }]
            });

            // Parse Date of Joining
            const joinDate = new Date(dojStr);
            const joinYearStr = this.getLeaveYearString(dojStr, leaveYearType);

            for (const policy of policies) {
                let allocatedDays = parseFloat(policy.yearly_allocation) || 0;

                // Prorate ONLY if the target allocation year is the same as the employee's joining year
                if (targetYear === joinYearStr && !policy.monthly_accrual_enabled && allocatedDays > 0) {
                    const joinMonth = joinDate.getMonth() + 1; // 1-12
                    if (leaveYearType === "Calendar Year") {
                        const remainingMonths = 13 - joinMonth; // e.g. July (7) -> 13-7 = 6 months remaining
                        allocatedDays = parseFloat(((allocatedDays * remainingMonths) / 12).toFixed(2));
                    } else if (leaveYearType === "Financial Year") {
                        // Financial Year starts in April (4)
                        let remainingMonths = 0;
                        if (joinMonth >= 4) {
                            remainingMonths = 13 - (joinMonth - 3);
                        } else {
                            remainingMonths = 4 - joinMonth;
                        }
                        allocatedDays = parseFloat(((allocatedDays * remainingMonths) / 12).toFixed(2));
                    }
                    // Round to the nearest half-day (0.5) increment
                    allocatedDays = Math.round(allocatedDays * 2) / 2;
                }

                // Get or create balance row
                const balance = await this.getOrCreateBalance(companyId, employeeId, policy.leave_type_id, targetYear);
                
                if (allocatedDays > 0) {
                    await balance.update({ allocated: allocatedDays });

                    // Log ledger transaction
                    await db.LeaveTransaction.create({
                        company_id: companyId,
                        employee_id: employeeId,
                        leave_type_id: policy.leave_type_id,
                        transaction_type: "Yearly Allocation",
                        leave_year: targetYear,
                        days: allocatedDays,
                        is_paid: policy.leaveType.is_paid,
                        description: `Automatic allocation for leave year ${targetYear} (DoJ: ${dojStr})`
                    });
                }
            }
        } catch (err) {
            console.error("Error auto allocating leaves on employee creation:", err);
        }
    }

    /**
     * Retrieve all leave balances with calculated values (Pending, Remaining, Comp Off unexpired)
     */
    static async getEmployeeBalances(companyId, employeeId, leaveYear = null) {
        const company = await db.Company.findByPk(companyId);
        const leaveYearType = company ? company.leave_year_type : "Calendar Year";

        if (!leaveYear) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            leaveYear = this.getLeaveYearString(`${yyyy}-${mm}-${dd}`, leaveYearType);
        }

        // Lazy allocation check: if no balance records exist for this year, allocate them dynamically now.
        const existingCount = await db.LeaveBalance.count({
            where: { employee_id: employeeId, leave_year: leaveYear }
        });
        if (existingCount === 0) {
            const employee = await db.Employee.findByPk(employeeId);
            if (employee) {
                await this.autoAllocateForEmployee(employee, leaveYear);
            }
        }

        const leaveTypes = await db.LeaveType.findAll({
            where: { company_id: companyId, is_active: true }
        });

        const balances = [];
        for (const type of leaveTypes) {
            const rawBalance = await this.getOrCreateBalance(companyId, employeeId, type.id, leaveYear);
            const pending = await LeaveValidationService.getPendingDays(employeeId, type.id, leaveYear);
            
            let allocated = parseFloat(rawBalance.allocated) || 0.00;
            let used = parseFloat(rawBalance.used) || 0.00;
            let carryForward = parseFloat(rawBalance.carry_forward) || 0.00;
            let remaining = 0.00;

            if (type.code === "COMP_OFF") {
                // Dynamic unexpired Comp Off calculations
                const compOffStats = await this.calculateUnexpiredCompOff(companyId, employeeId, type.id);
                allocated = parseFloat(rawBalance.allocated) || 0.00;
                used = compOffStats.totalUsed;
                carryForward = 0.00;
                remaining = compOffStats.available - pending;
            } else {
                remaining = allocated + carryForward - used - pending;
            }

            balances.push({
                leave_type_id: type.id,
                leave_name: type.name,
                leave_code: type.code,
                is_paid: type.is_paid,
                allocated,
                used,
                pending,
                carry_forward: carryForward,
                remaining: Math.max(0, remaining)
            });
        }

        return balances;
    }

    /**
     * Calculate dynamic Comp Off statistics from transactions
     */
    static async calculateUnexpiredCompOff(companyId, employeeId, compOffTypeId) {
        const company = await db.Company.findByPk(companyId);
        const expiryDays = company ? company.comp_off_expiry_days : 90;

        // 1. Fetch all transactions for this employee's Comp Off in chronological order
        const txs = await db.LeaveTransaction.findAll({
            where: {
                company_id: companyId,
                employee_id: employeeId,
                leave_type_id: compOffTypeId
            },
            order: [["createdAt", "ASC"]]
        });

        const grants = [];
        let consumed = 0;
        let actualLeaveUsed = 0;

        // 2. Classify grants, calculate consumption, and sum actual approved leave days
        for (const tx of txs) {
            const days = parseFloat(tx.days) || 0;
            if (tx.transaction_type === "Manual Balance Adjustment" && days > 0) {
                grants.push({
                    days: days,
                    createdAt: tx.createdAt || tx.created_at
                });
            } else if (tx.transaction_type === "Leave Approval") {
                consumed += Math.abs(days);
                actualLeaveUsed += Math.abs(days);
            } else if (tx.transaction_type === "Leave Cancellation") {
                consumed -= days; // Reclaim consumed balance
                actualLeaveUsed -= days;
            } else if (tx.transaction_type === "Manual Balance Adjustment" && days < 0) {
                consumed += Math.abs(days);
            }
        }

        consumed = Math.max(0, consumed);
        actualLeaveUsed = Math.max(0, actualLeaveUsed);

        // 3. FIFO calculation for unexpired Comp Off days
        const now = new Date();
        let ledgerGranted = 0;
        let available = 0;

        for (const grant of grants) {
            const grantDate = new Date(grant.createdAt);
            const expiryDate = new Date(grantDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);
            const isExpired = expiryDate < now;
            const daysGranted = grant.days;
            
            ledgerGranted += daysGranted;

            if (!isExpired) {
                if (consumed >= daysGranted) {
                    consumed -= daysGranted;
                } else {
                    const unconsumed = daysGranted - consumed;
                    consumed = 0;
                    available += unconsumed;
                }
            } else {
                if (consumed >= daysGranted) {
                    consumed -= daysGranted;
                } else {
                    consumed = 0;
                }
            }
        }

        return {
            ledgerGranted,
            totalUsed: actualLeaveUsed,
            available: Math.max(0, available),
            expired: Math.max(0, ledgerGranted - actualLeaveUsed - available)
        };
    }

    /**
     * Get Leave Year string based on date and policy configuration
     */
    static getLeaveYearString(dateStr, yearType) {
        const date = new Date(dateStr);
        const yyyy = date.getFullYear();

        if (yearType === "Financial Year") {
            const mm = date.getMonth() + 1;
            if (mm >= 4) {
                return `${yyyy}-${yyyy + 1}`;
            } else {
                return `${yyyy - 1}-${yyyy}`;
            }
        } else if (yearType === "Joining Anniversary") {
            // Calculated per employee, but return start year for balance indexing
            return `${yyyy}`;
        }
        return `${yyyy}`; // Calendar Year defaults to current year
    }
}

module.exports = LeaveBalanceService;
