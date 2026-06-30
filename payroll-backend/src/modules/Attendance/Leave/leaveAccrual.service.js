const db = require("../../../database/models/index");
const LeaveBalanceService = require("./leaveBalance.service");
const logger = require("../../../utils/logger");
const { TRANSACTION_TYPE } = require("./leave.constants");

class LeaveAccrualService {
    /**
     * Process monthly leave accruals for a company
     */
    static async processMonthlyAccrual(companyId, changedBy = null) {
        try {
            const company = await db.Company.findByPk(companyId);
            if (!company) throw new Error("Company not found.");

            const leaveYearType = company.leave_year_type || "Calendar Year";

            // Find all active employees in the company
            const employees = await db.Employee.findAll({
                where: { company_id: companyId, status: true }
            });

            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            const todayStr = `${yyyy}-${mm}-${dd}`;

            let processedCount = 0;

            for (const emp of employees) {
                if (!emp.employee_type_id) continue;

                // Process in employee-scoped transaction for database consistency
                const transaction = await db.sequelize.transaction();
                try {
                    // Find active policies for this employee type that have monthly accrual enabled
                    const policies = await db.LeavePolicy.findAll({
                        where: {
                            company_id: companyId,
                            employee_type_id: emp.employee_type_id,
                            monthly_accrual_enabled: true
                        },
                        include: [{ model: db.LeaveType, as: "leaveType", where: { is_active: true } }],
                        transaction
                    });

                    const leaveYear = LeaveBalanceService.getLeaveYearString(todayStr, leaveYearType);

                    for (const policy of policies) {
                        const balance = await LeaveBalanceService.getOrCreateBalance(companyId, emp.id, policy.leave_type_id, leaveYear, transaction);
                        const currentAllocated = parseFloat(balance.allocated) || 0.00;
                        const maxAllocation = parseFloat(policy.yearly_allocation) || 0.00;

                        if (currentAllocated >= maxAllocation) {
                            continue;
                        }

                        // Calculate accrual increment without exceeding the yearly allocation cap
                        const accrualAmount = parseFloat(policy.monthly_accrual_amount) || 0.00;
                        let increment = accrualAmount;
                        if (currentAllocated + increment > maxAllocation) {
                            increment = maxAllocation - currentAllocated;
                        }

                        if (increment > 0) {
                            const newAllocated = parseFloat((currentAllocated + increment).toFixed(2));
                            await balance.update({ allocated: newAllocated }, { transaction });

                            // Log transaction in ledger
                            await db.LeaveTransaction.create({
                                company_id: companyId,
                                employee_id: emp.id,
                                leave_type_id: policy.leave_type_id,
                                transaction_type: TRANSACTION_TYPE.MONTHLY_ACCURAL,
                                leave_year: leaveYear,
                                days: increment,
                                is_paid: policy.leaveType.is_paid,
                                description: `Monthly accrual increment of ${increment} days`,
                                changed_by: changedBy
                            }, { transaction });

                            processedCount++;
                        }
                    }
                    await transaction.commit();
                } catch (empErr) {
                    await transaction.rollback();
                    logger.error("Error processing monthly accrual for employee", empErr, { employeeId: emp.id });
                }
            }

            return {
                success: true,
                message: `Accrual completed. Processed ${processedCount} balance increments.`,
                processedCount
            };
        } catch (err) {
            logger.error("Error in processMonthlyAccrual", err, { companyId });
            throw err;
        }
    }

    /**
     * Process year-end carry forward for a company
     */
    static async processYearEndCarryForward(companyId, fromYear, toYear, changedBy = null) {
        try {
            const company = await db.Company.findByPk(companyId);
            if (!company) throw new Error("Company not found.");

            // Find all active employees in the company
            const employees = await db.Employee.findAll({
                where: { company_id: companyId, status: true }
            });

            let processedCount = 0;

            for (const emp of employees) {
                if (!emp.employee_type_id) continue;

                // Process in employee-scoped transaction for database consistency
                const transaction = await db.sequelize.transaction();
                try {
                    // Fetch active policies that allow carry forward
                    const policies = await db.LeavePolicy.findAll({
                        where: {
                            company_id: companyId,
                            employee_type_id: emp.employee_type_id,
                            carry_forward_allowed: true
                        },
                        include: [{ model: db.LeaveType, as: "leaveType", where: { is_active: true } }],
                        transaction
                    });

                    for (const policy of policies) {
                        // Get balance of previous year
                        const oldBalance = await db.LeaveBalance.findOne({
                            where: {
                                company_id: companyId,
                                employee_id: emp.id,
                                leave_type_id: policy.leave_type_id,
                                leave_year: fromYear
                            },
                            transaction
                        });

                        if (!oldBalance) continue;

                        const allocated = parseFloat(oldBalance.allocated) || 0.00;
                        const carryForward = parseFloat(oldBalance.carry_forward) || 0.00;
                        const used = parseFloat(oldBalance.used) || 0.00;
                        
                        // Remaining balance to carry forward
                        const remaining = Math.max(0, allocated + carryForward - used);
                        const maxCF = parseFloat(policy.max_carry_forward) || 0.00;
                        const cfAmount = parseFloat(Math.min(remaining, maxCF).toFixed(2));

                        if (cfAmount > 0) {
                            // Credit to the new year balance
                            const newBalance = await LeaveBalanceService.getOrCreateBalance(companyId, emp.id, policy.leave_type_id, toYear, transaction);
                            const currentCF = parseFloat(newBalance.carry_forward) || 0.00;
                            await newBalance.update({ carry_forward: parseFloat((currentCF + cfAmount).toFixed(2)) }, { transaction });

                            // Log ledger transaction
                            await db.LeaveTransaction.create({
                                company_id: companyId,
                                employee_id: emp.id,
                                leave_type_id: policy.leave_type_id,
                                transaction_type: TRANSACTION_TYPE.CARRY_FORWARD,
                                leave_year: toYear,
                                days: cfAmount,
                                is_paid: policy.leaveType.is_paid,
                                description: `Year-end carry forward of ${cfAmount} days from year ${fromYear}`,
                                changed_by: changedBy
                            }, { transaction });

                            processedCount++;
                        }
                    }
                    await transaction.commit();
                } catch (empErr) {
                    await transaction.rollback();
                    logger.error("Error processing carry forward for employee", empErr, { employeeId: emp.id });
                }
            }

            return {
                success: true,
                message: `Year-end carry forward completed. Processed ${processedCount} records.`,
                processedCount
            };
        } catch (err) {
            logger.error("Error in processYearEndCarryForward", err, { companyId, fromYear, toYear });
            throw err;
        }
    }
}

module.exports = LeaveAccrualService;
