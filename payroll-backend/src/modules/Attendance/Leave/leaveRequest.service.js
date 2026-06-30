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
