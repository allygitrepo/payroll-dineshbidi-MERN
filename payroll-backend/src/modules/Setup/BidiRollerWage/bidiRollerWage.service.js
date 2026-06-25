const { Op } = require("sequelize");
const BidiRollerWage = require("./bidiRollerWage.model");
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

/**
 * Validates start date is before end date and check for overlapping date periods for the same company.
 */
const validateDatesAndOverlaps = async (companyId, startDate, endDate, excludeId = null) => {
    if (new Date(startDate) > new Date(endDate)) {
        const error = new Error("Start date cannot be after end date.");
        error.statusCode = 400;
        error.errorCode = "INVALID_DATE_RANGE";
        error.messageToShow = "Start date cannot be after end date.";
        throw error;
    }

    const whereCondition = {
        company_id: companyId,
        status: true,
        start_date: {
            [Op.lte]: endDate,
        },
        end_date: {
            [Op.gte]: startDate,
        },
    };

    if (excludeId) {
        whereCondition.id = { [Op.ne]: excludeId };
    }

    const overlapping = await BidiRollerWage.findOne({ where: whereCondition });
    if (overlapping) {
        const error = new Error("Bidi Roller Wages dates overlap with an existing setup.");
        error.statusCode = 400;
        error.errorCode = "OVERLAPPING_DATES";
        error.messageToShow = `The dates overlap with another active setup (${overlapping.start_date} to ${overlapping.end_date}).`;
        throw error;
    }
};

class BidiRollerWageService {
    /**
     * Creates a new Bidi Roller Wages Setup.
     */
    static async createBidiRollerWage(wageData, userId) {
        const { company_id, start_date, end_date } = wageData;

        // 1. Verify Company Ownership
        await verifyCompanyOwnership(company_id, userId);

        // 2. Validate dates and verify no overlapping periods
        await validateDatesAndOverlaps(company_id, start_date, end_date);

        // 3. Create Bidi Roller Wage Setup
        return await BidiRollerWage.create(wageData);
    }

    /**
     * Retrieves all active Bidi Roller Wages Setups for a specific company.
     */
    static async getAllBidiRollerWages(companyId, userId) {
        // Verify Company Ownership
        await verifyCompanyOwnership(companyId, userId);

        return await BidiRollerWage.findAll({
            where: { company_id: companyId, status: true },
            order: [["start_date", "ASC"]],
        });
    }

    /**
     * Retrieves a single Bidi Roller Wages Setup by ID.
     */
    static async getBidiRollerWageById(id, userId) {
        const wage = await BidiRollerWage.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!wage) {
            const error = new Error("Bidi Roller Wages setup not found.");
            error.statusCode = 404;
            error.errorCode = "BIDI_ROLLER_WAGES_NOT_FOUND";
            error.messageToShow = "Bidi Roller Wages setup not found.";
            throw error;
        }

        if (!wage.company || wage.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const result = wage.toJSON();
        delete result.company;
        return result;
    }

    /**
     * Updates an existing Bidi Roller Wages Setup.
     */
    static async updateBidiRollerWage(id, userId, updateData) {
        const wage = await BidiRollerWage.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!wage) {
            const error = new Error("Bidi Roller Wages setup not found.");
            error.statusCode = 404;
            error.errorCode = "BIDI_ROLLER_WAGES_NOT_FOUND";
            error.messageToShow = "Bidi Roller Wages setup not found.";
            throw error;
        }

        if (!wage.company || wage.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Validate overlapping dates if they are being updated
        if (updateData.start_date || updateData.end_date) {
            const newStartDate = updateData.start_date || wage.start_date;
            const newEndDate = updateData.end_date || wage.end_date;
            await validateDatesAndOverlaps(wage.company_id, newStartDate, newEndDate, id);
        }

        // Perform the update
        await wage.update(updateData);

        return await BidiRollerWage.findByPk(id);
    }

    /**
     * Soft-deletes a Bidi Roller Wages Setup.
     */
    static async deleteBidiRollerWage(id, userId) {
        const wage = await BidiRollerWage.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!wage) {
            const error = new Error("Bidi Roller Wages setup not found.");
            error.statusCode = 404;
            error.errorCode = "BIDI_ROLLER_WAGES_NOT_FOUND";
            error.messageToShow = "Bidi Roller Wages setup not found.";
            throw error;
        }

        if (!wage.company || wage.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await wage.update({ status: false });
        return true;
    }
}

module.exports = BidiRollerWageService;
