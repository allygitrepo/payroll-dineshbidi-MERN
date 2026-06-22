const { Op } = require("sequelize");
const ChallanSetup = require("./challanSetup.model");
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

    const overlapping = await ChallanSetup.findOne({ where: whereCondition });
    if (overlapping) {
        const error = new Error("Challan Setup dates overlap with an existing setup.");
        error.statusCode = 400;
        error.errorCode = "OVERLAPPING_DATES";
        error.messageToShow = `The dates overlap with another active setup (${overlapping.start_date} to ${overlapping.end_date}).`;
        throw error;
    }
};

class ChallanSetupService {
    /**
     * Creates a new Challan Setup.
     */
    static async createChallanSetup(setupData, userId) {
        const { company_id, start_date, end_date } = setupData;

        // 1. Verify Company Ownership
        await verifyCompanyOwnership(company_id, userId);

        // 2. Validate dates and verify no overlapping periods
        await validateDatesAndOverlaps(company_id, start_date, end_date);

        // 3. Create Challan Setup
        return await ChallanSetup.create(setupData);
    }

    /**
     * Retrieves all active Challan Setups for a specific company.
     */
    static async getAllChallanSetups(companyId, userId) {
        // Verify Company Ownership
        await verifyCompanyOwnership(companyId, userId);

        return await ChallanSetup.findAll({
            where: { company_id: companyId, status: true },
            order: [["start_date", "ASC"]],
        });
    }

    /**
     * Retrieves a single Challan Setup by ID.
     */
    static async getChallanSetupById(id, userId) {
        const setup = await ChallanSetup.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!setup) {
            const error = new Error("Challan Setup not found.");
            error.statusCode = 404;
            error.errorCode = "CHALLAN_SETUP_NOT_FOUND";
            error.messageToShow = "Challan Setup not found.";
            throw error;
        }

        if (!setup.company || setup.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Return without include object or keep it clean
        const result = setup.toJSON();
        delete result.company;
        return result;
    }

    /**
     * Updates an existing Challan Setup.
     */
    static async updateChallanSetup(id, userId, updateData) {
        const setup = await ChallanSetup.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!setup) {
            const error = new Error("Challan Setup not found.");
            error.statusCode = 404;
            error.errorCode = "CHALLAN_SETUP_NOT_FOUND";
            error.messageToShow = "Challan Setup not found.";
            throw error;
        }

        if (!setup.company || setup.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Validate overlapping dates if they are being updated
        if (updateData.start_date || updateData.end_date) {
            const newStartDate = updateData.start_date || setup.start_date;
            const newEndDate = updateData.end_date || setup.end_date;
            await validateDatesAndOverlaps(setup.company_id, newStartDate, newEndDate, id);
        }

        // Perform the update
        await setup.update(updateData);

        return await ChallanSetup.findByPk(id);
    }

    /**
     * Soft-deletes a Challan Setup.
     */
    static async deleteChallanSetup(id, userId) {
        const setup = await ChallanSetup.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!setup) {
            const error = new Error("Challan Setup not found.");
            error.statusCode = 404;
            error.errorCode = "CHALLAN_SETUP_NOT_FOUND";
            error.messageToShow = "Challan Setup not found.";
            throw error;
        }

        if (!setup.company || setup.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await setup.update({ status: false });
        return true;
    }
}

module.exports = ChallanSetupService;
