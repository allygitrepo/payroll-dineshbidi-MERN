const LeaveMaster = require("./leaveMaster.model");
const Company = require("../../Masters/Company/company.model");

const verifyCompanyOwnership = async (companyId, userId) => {
    const company = await Company.findOne({ where: { id: companyId, cstatus: true } });
    if (!company) {
        const error = new Error("Company not found.");
        error.statusCode = 404;
        error.errorCode = "COMPANY_NOT_FOUND";
        error.messageToShow = "Company not found.";
        throw error;
    }

    if (company.user_id !== userId) {
        const error = new Error("Access denied.");
        error.statusCode = 403;
        error.errorCode = "ACCESS_DENIED";
        error.messageToShow = "Access denied.";
        throw error;
    }
    return company;
};

class LeaveMasterService {
    /**
     * Get Leave Master entries for a company
     */
    static async getLeaveMasterConfig(companyId, userId) {
        await verifyCompanyOwnership(companyId, userId);

        return await LeaveMaster.findAll({
            where: { company_id: companyId, status: true },
            order: [["created_at", "ASC"]],
        });
    }

    /**
     * Save Leave Master entries and Yearly Leave Cap
     */
    static async saveLeaveMasterConfig(companyId, userId, configData) {
        await verifyCompanyOwnership(companyId, userId);

        const { yearly_leave_cap, leave_types } = configData;
        const cap = parseFloat(yearly_leave_cap) || 12.0;

        // If leave_types is empty, we must keep or create at least one placeholder record containing the cap
        if (!leave_types || leave_types.length === 0) {
            // Find if any record exists
            const existingRecords = await LeaveMaster.findAll({
                where: { company_id: companyId, status: true }
            });

            if (existingRecords.length > 0) {
                // Update the first record to be a placeholder
                const first = existingRecords[0];
                await first.update({
                    leave_type: null,
                    leave_days: null,
                    yearly_leave_cap: cap
                });

                // Delete any other records
                const otherIds = existingRecords.slice(1).map(r => r.id);
                if (otherIds.length > 0) {
                    await LeaveMaster.destroy({ where: { id: otherIds } });
                }
            } else {
                // Create a placeholder record
                await LeaveMaster.create({
                    company_id: companyId,
                    leave_type: null,
                    leave_days: null,
                    yearly_leave_cap: cap,
                    status: true
                });
            }
        } else {
            // We have one or more leave types.
            // Collect incoming non-null IDs
            const incomingIds = leave_types.map(t => t.id).filter(Boolean);

            // Delete all records that are NOT in the incoming list (including any old placeholders)
            await LeaveMaster.destroy({
                where: {
                    company_id: companyId,
                    status: true,
                    id: {
                        [require("sequelize").Op.notIn]: incomingIds.length > 0 ? incomingIds : ["placeholder-nonexistent-id"]
                    }
                }
            });

            // Process each item
            for (const t of leave_types) {
                const leaveDays = t.leave_days !== undefined && t.leave_days !== null && t.leave_days !== "" ? parseFloat(t.leave_days) : null;
                
                if (t.id) {
                    // Update existing
                    await LeaveMaster.update(
                        {
                            leave_type: t.leave_type,
                            leave_days: leaveDays,
                            yearly_leave_cap: cap
                        },
                        {
                            where: { id: t.id, company_id: companyId }
                        }
                    );
                } else {
                    // Create new
                    await LeaveMaster.create({
                        company_id: companyId,
                        leave_type: t.leave_type,
                        leave_days: leaveDays,
                        yearly_leave_cap: cap,
                        status: true
                    });
                }
            }

            // In case there are other records, make sure they all have the updated cap
            await LeaveMaster.update(
                { yearly_leave_cap: cap },
                { where: { company_id: companyId, status: true } }
            );
        }

        return await this.getLeaveMasterConfig(companyId, userId);
    }

    /**
     * Delete a single leave type
     */
    static async deleteLeaveType(id, userId) {
        const record = await LeaveMaster.findByPk(id);
        if (!record) {
            const error = new Error("Leave type not found.");
            error.statusCode = 404;
            error.errorCode = "LEAVE_TYPE_NOT_FOUND";
            error.messageToShow = "Leave type not found.";
            throw error;
        }

        await verifyCompanyOwnership(record.company_id, userId);

        const companyId = record.company_id;

        // If this is the last record, instead of deleting, convert it to a placeholder
        const count = await LeaveMaster.count({ where: { company_id: companyId, status: true } });
        if (count <= 1) {
            await record.update({
                leave_type: null,
                leave_days: null
            });
        } else {
            await record.destroy();
        }

        return await this.getLeaveMasterConfig(companyId, userId);
    }
}

module.exports = LeaveMasterService;
