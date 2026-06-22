const { Op } = require("sequelize");
const Calender = require("./calender.model");
const Company = require("../../Masters/Company/company.model");

/**
 * Helper to verify company exists and belongs to user.
 */
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

class CalenderService {
    /**
     * Creates a new Calender Holiday entry.
     */
    static async createCalender(calenderData, userId) {
        const { company_id, holiday_type, week_day, holiday_date, remark } = calenderData;

        // 1. Verify Company Ownership
        await verifyCompanyOwnership(company_id, userId);

        // 2. Determine Year
        let year = null;
        if (holiday_date) {
            year = new Date(holiday_date).getFullYear();
        } else {
            year = new Date().getFullYear();
        }

        // 3. Create entry
        return await Calender.create({
            company_id,
            holiday_type,
            week_day: holiday_type === "WEEKLY" ? week_day : null,
            holiday_date: holiday_type === "COMPANY" ? holiday_date : null,
            year,
            remark,
        });
    }

    /**
     * Retrieves all active Calender entries for a specific company.
     */
    static async getAllCalenders(companyId, userId) {
        // Verify Company Ownership
        await verifyCompanyOwnership(companyId, userId);

        return await Calender.findAll({
            where: { company_id: companyId, status: true },
            order: [
                ["holiday_date", "ASC"],
                ["created_at", "DESC"],
            ],
        });
    }

    /**
     * Retrieves a single Calender entry by ID.
     */
    static async getCalenderById(id, userId) {
        const entry = await Calender.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!entry) {
            const error = new Error("Calender Holiday entry not found.");
            error.statusCode = 404;
            error.errorCode = "CALENDER_NOT_FOUND";
            error.messageToShow = "Calender Holiday entry not found.";
            throw error;
        }

        if (!entry.company || entry.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const result = entry.toJSON();
        delete result.company;
        return result;
    }

    /**
     * Updates an existing Calender entry.
     */
    static async updateCalender(id, userId, updateData) {
        const entry = await Calender.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!entry) {
            const error = new Error("Calender Holiday entry not found.");
            error.statusCode = 404;
            error.errorCode = "CALENDER_NOT_FOUND";
            error.messageToShow = "Calender Holiday entry not found.";
            throw error;
        }

        if (!entry.company || entry.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Handle year update if holiday_date is updated
        if (updateData.holiday_date !== undefined) {
            if (updateData.holiday_date) {
                updateData.year = new Date(updateData.holiday_date).getFullYear();
            } else if (updateData.holiday_type === "WEEKLY" || entry.holiday_type === "WEEKLY") {
                updateData.year = new Date().getFullYear();
            }
        }

        // If type changes, make sure the other type's fields are cleaned
        const type = updateData.holiday_type || entry.holiday_type;
        if (type === "COMPANY") {
            updateData.week_day = null;
        } else if (type === "WEEKLY") {
            updateData.holiday_date = null;
        }

        // Perform the update
        await entry.update(updateData);

        return await Calender.findByPk(id);
    }

    /**
     * Soft-deletes a Calender entry.
     */
    static async deleteCalender(id, userId) {
        const entry = await Calender.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!entry) {
            const error = new Error("Calender Holiday entry not found.");
            error.statusCode = 404;
            error.errorCode = "CALENDER_NOT_FOUND";
            error.messageToShow = "Calender Holiday entry not found.";
            throw error;
        }

        if (!entry.company || entry.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await entry.update({ status: false });
        return true;
    }
}

module.exports = CalenderService;
