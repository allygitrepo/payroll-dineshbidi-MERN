const db = require("../../../database/models/index");
const LeaveBalanceService = require("../../Attendance/Leave/leaveBalance.service");
const LeaveAccrualService = require("../../Attendance/Leave/leaveAccrual.service");

class LeaveMasterService {
    /**
     * Tab 1: Leave Types
     */
    static async getLeaveTypes(companyId) {
        return await db.LeaveType.findAll({
            where: { company_id: companyId },
            order: [["created_at", "ASC"]]
        });
    }

    static async saveLeaveType(companyId, data) {
        const { id, name, code, is_paid, half_day_allowed, requires_supporting_document, requires_approval, is_active } = data;
        
        if (id) {
            const existing = await db.LeaveType.findOne({ where: { id, company_id: companyId } });
            if (!existing) throw new Error("Leave Type not found.");
            return await existing.update({
                name,
                code,
                is_paid: is_paid !== undefined ? is_paid : existing.is_paid,
                half_day_allowed: half_day_allowed !== undefined ? half_day_allowed : existing.half_day_allowed,
                requires_supporting_document: requires_supporting_document !== undefined ? requires_supporting_document : existing.requires_supporting_document,
                requires_approval: requires_approval !== undefined ? requires_approval : existing.requires_approval,
                is_active: is_active !== undefined ? is_active : existing.is_active
            });
        }

        return await db.LeaveType.create({
            company_id: companyId,
            name,
            code,
            is_paid: is_paid !== undefined ? is_paid : true,
            half_day_allowed: half_day_allowed !== undefined ? half_day_allowed : true,
            requires_supporting_document: requires_supporting_document !== undefined ? requires_supporting_document : false,
            requires_approval: requires_approval !== undefined ? requires_approval : true,
            is_active: is_active !== undefined ? is_active : true
        });
    }

    static async deleteLeaveType(companyId, id) {
        const existing = await db.LeaveType.findOne({ where: { id, company_id: companyId } });
        if (!existing) throw new Error("Leave Type not found.");
        
        // Soft delete or hard delete. Since we have associations, let's hard delete if no active requests use it, otherwise mark inactive
        const usageCount = await db.LeaveRequest.count({ where: { leave_type_id: id } });
        if (usageCount > 0) {
            await existing.update({ is_active: false });
            return { message: "Leave type has associated requests. Marked as inactive." };
        }
        
        await existing.destroy();
        return { message: "Leave type deleted successfully." };
    }

    /**
     * Tab 2: Leave Policies Matrix
     */
    static async getLeavePoliciesMatrix(companyId) {
        const employeeTypes = ["BIDI PACKER", "BIDI MAKER", "OFFICE STAFF"];
        const leaveTypes = await db.LeaveType.findAll({ where: { company_id: companyId, is_active: true } });
        const existingPolicies = await db.LeavePolicy.findAll({ where: { company_id: companyId } });

        // Build a complete matrix of combinations
        const matrix = [];
        for (const empType of employeeTypes) {
            const row = {
                employee_type_id: empType,
                employee_type: empType,
                employee_type_name: empType,
                policies: []
            };

            for (const lt of leaveTypes) {
                // Find existing policy config
                let policy = existingPolicies.find(
                    p => p.employee_type === empType && p.leave_type_id === lt.id
                );

                if (!policy) {
                    // Create dynamic defaults if not present
                    policy = {
                        id: null,
                        company_id: companyId,
                        employee_type_id: empType,
                        employee_type: empType,
                        leave_type_id: lt.id,
                        yearly_allocation: 0.00,
                        monthly_accrual_enabled: false,
                        monthly_accrual_amount: 0.00,
                        carry_forward_allowed: false,
                        max_carry_forward: 0.00
                    };
                } else {
                    policy = policy.toJSON ? policy.toJSON() : policy;
                    policy.employee_type_id = empType;
                }

                row.policies.push({
                    leave_type_id: lt.id,
                    leave_name: lt.name,
                    leave_code: lt.code,
                    policy
                });
            }
            matrix.push(row);
        }

        return matrix;
    }

    static async saveLeavePolicy(companyId, data) {
        const { employee_type, employee_type_id, leave_type_id, yearly_allocation, monthly_accrual_enabled, monthly_accrual_amount, carry_forward_allowed, max_carry_forward } = data;
        const resolvedEmpType = employee_type || employee_type_id;

        if (!resolvedEmpType) {
            throw new Error("Employee type is required.");
        }

        const [policy, created] = await db.LeavePolicy.findOrCreate({
            where: {
                company_id: companyId,
                employee_type: resolvedEmpType,
                leave_type_id
            },
            defaults: {
                company_id: companyId,
                employee_type: resolvedEmpType,
                leave_type_id,
                yearly_allocation,
                monthly_accrual_enabled,
                monthly_accrual_amount,
                carry_forward_allowed,
                max_carry_forward
            }
        });

        if (!created) {
            await policy.update({
                yearly_allocation,
                monthly_accrual_enabled,
                monthly_accrual_amount,
                carry_forward_allowed,
                max_carry_forward
            });
        }

        return policy;
    }

    /**
     * Tab 3: Global Leave Settings
     */
    static async getGlobalSettings(companyId) {
        const company = await db.Company.findByPk(companyId);
        if (!company) throw new Error("Company not found.");
        return {
            leave_year_type: company.leave_year_type,
            sandwich_policy_enabled: company.sandwich_policy_enabled,
            comp_off_expiry_days: company.comp_off_expiry_days
        };
    }

    static async saveGlobalSettings(companyId, data) {
        const company = await db.Company.findByPk(companyId);
        if (!company) throw new Error("Company not found.");
        const { leave_year_type, sandwich_policy_enabled, comp_off_expiry_days } = data;
        return await company.update({
            leave_year_type: leave_year_type || company.leave_year_type,
            sandwich_policy_enabled: sandwich_policy_enabled !== undefined ? sandwich_policy_enabled : company.sandwich_policy_enabled,
            comp_off_expiry_days: comp_off_expiry_days !== undefined ? comp_off_expiry_days : company.comp_off_expiry_days
        });
    }

    /**
     * Manual Balance Adjustment (HR manual credits/adjustments)
     */
     static async adjustBalance(companyId, data, changedBy = null) {
        const { employeeId, leaveTypeId, leaveYear, allocated, carryForward, reason } = data;
        const transaction = await db.sequelize.transaction();
        try {
            const balance = await LeaveBalanceService.getOrCreateBalance(companyId, employeeId, leaveTypeId, leaveYear, transaction);
            const leaveType = await db.LeaveType.findByPk(leaveTypeId, { transaction });
            
            const oldAllocated = parseFloat(balance.allocated) || 0.00;
            const oldCarryForward = parseFloat(balance.carry_forward) || 0.00;

            const newAllocated = allocated !== undefined ? parseFloat(allocated) : oldAllocated;
            const newCarryForward = carryForward !== undefined ? parseFloat(carryForward) : oldCarryForward;

            await balance.update({
                allocated: newAllocated,
                carry_forward: newCarryForward
            }, { transaction });

            // Calculate adjustment offset and write transaction logs
            const allocatedDiff = newAllocated - oldAllocated;
            const carryForwardDiff = newCarryForward - oldCarryForward;

            if (allocatedDiff !== 0) {
                await db.LeaveTransaction.create({
                    company_id: companyId,
                    employee_id: employeeId,
                    leave_type_id: leaveTypeId,
                    transaction_type: "Manual Balance Adjustment",
                    leave_year: leaveYear,
                    days: allocatedDiff,
                    is_paid: leaveType ? leaveType.is_paid : true,
                    description: `Manual adjustment of allocated leaves: ${allocatedDiff >= 0 ? '+' : ''}${allocatedDiff} days. Reason: ${reason || 'N/A'}`,
                    changed_by: changedBy
                }, { transaction });
            }

            if (carryForwardDiff !== 0) {
                await db.LeaveTransaction.create({
                    company_id: companyId,
                    employee_id: employeeId,
                    leave_type_id: leaveTypeId,
                    transaction_type: "Carry Forward",
                    leave_year: leaveYear,
                    days: carryForwardDiff,
                    is_paid: leaveType ? leaveType.is_paid : true,
                    description: `Manual adjustment of carry forward balance: ${carryForwardDiff >= 0 ? '+' : ''}${carryForwardDiff} days. Reason: ${reason || 'N/A'}`,
                    changed_by: changedBy
                }, { transaction });
            }

            await transaction.commit();
            return balance;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

module.exports = LeaveMasterService;
