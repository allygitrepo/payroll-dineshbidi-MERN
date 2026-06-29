const db = require("../../../database/models/index");

class LeaveRequestService {
    async getAllByCompany(companyId) {
        return await db.LeaveRequest.findAll({
            where: { company_id: companyId },
            include: [
                {
                    model: db.Employee,
                    as: "employee",
                    attributes: ["id", "name", "image_path", "uan", "mobile", "employee_type"],
                }
            ],
            order: [["created_at", "DESC"]],
        });
    }

    async getLatestRemainingLeaves(employeeId) {
        const lastApproved = await db.LeaveRequest.findOne({
            where: { employee_id: employeeId, status: "Approved" },
            order: [["updated_at", "DESC"]],
        });
        if (lastApproved) {
            return parseFloat(lastApproved.remaining_leaves);
        }

        // Fetch company dynamic yearly leave cap
        try {
            const employee = await db.Employee.findByPk(employeeId);
            if (employee && employee.company_id) {
                const leaveMaster = await db.LeaveMaster.findOne({
                    where: { company_id: employee.company_id, status: true }
                });
                if (leaveMaster && leaveMaster.yearly_leave_cap !== null && leaveMaster.yearly_leave_cap !== undefined) {
                    return parseFloat(leaveMaster.yearly_leave_cap);
                }
            }
        } catch (e) {
            console.error("Error fetching dynamic yearly cap:", e);
        }

        return 0.0;
    }

    async create(data) {
        return await db.LeaveRequest.create(data);
    }

    async getById(id) {
        return await db.LeaveRequest.findByPk(id, {
            include: [
                {
                    model: db.Employee,
                    as: "employee",
                    attributes: ["id", "name", "image_path", "uan", "mobile", "employee_type"],
                }
            ],
        });
    }

    async updateStatus(id, status, remainingLeaves = null) {
        const updateData = { status };
        if (remainingLeaves !== null) {
            updateData.remaining_leaves = remainingLeaves;
        }
        await db.LeaveRequest.update(updateData, { where: { id } });
        return await this.getById(id);
    }
}

module.exports = new LeaveRequestService();
