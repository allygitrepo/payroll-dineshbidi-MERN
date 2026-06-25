const { Op } = require("sequelize");
const ProfessionalTax = require("./professionalTax.model");
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
 * Validates dates and checks for overlapping slabs (both in date range and salary range).
 */
const validateDatesAndSlabs = async (companyId, startDate, endDate, fromAmount, toAmount, excludeId = null) => {
    if (new Date(startDate) > new Date(endDate)) {
        const error = new Error("Start date cannot be after end date.");
        error.statusCode = 400;
        error.errorCode = "INVALID_DATE_RANGE";
        error.messageToShow = "Start date cannot be after end date.";
        throw error;
    }

    if (Number(fromAmount) > Number(toAmount)) {
        const error = new Error("From amount cannot be greater than to amount.");
        error.statusCode = 400;
        error.errorCode = "INVALID_SLAB_RANGE";
        error.messageToShow = "From amount cannot be greater than to amount.";
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
        from_amount: {
            [Op.lte]: toAmount,
        },
        to_amount: {
            [Op.gte]: fromAmount,
        },
    };

    if (excludeId) {
        whereCondition.id = { [Op.ne]: excludeId };
    }

    const overlapping = await ProfessionalTax.findOne({ where: whereCondition });
    if (overlapping) {
        const error = new Error("Professional Tax slab overlaps with an existing configuration.");
        error.statusCode = 400;
        error.errorCode = "OVERLAPPING_SLABS";
        error.messageToShow = `This slab overlaps with another active slab (${overlapping.start_date} to ${overlapping.end_date}, Slab: ${overlapping.from_amount} - ${overlapping.to_amount}).`;
        throw error;
    }
};

class ProfessionalTaxService {
    /**
     * Creates a new Professional Tax slab setup.
     */
    static async createProfessionalTax(ptData, userId) {
        const { company_id, start_date, end_date, from_amount, to_amount } = ptData;

        // 1. Verify Company Ownership
        await verifyCompanyOwnership(company_id, userId);

        // 2. Validate slab bounds and verify no overlaps
        await validateDatesAndSlabs(company_id, start_date, end_date, from_amount, to_amount);

        // 3. Create Professional Tax record
        return await ProfessionalTax.create(ptData);
    }

    /**
     * Retrieves all active Professional Tax slabs for a specific company.
     */
    static async getAllProfessionalTaxes(companyId, userId) {
        // Verify Company Ownership
        await verifyCompanyOwnership(companyId, userId);

        return await ProfessionalTax.findAll({
            where: { company_id: companyId, status: true },
            order: [
                ["start_date", "ASC"],
                ["from_amount", "ASC"],
            ],
        });
    }

    /**
     * Retrieves a single Professional Tax slab by ID.
     */
    static async getProfessionalTaxById(id, userId) {
        const pt = await ProfessionalTax.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!pt) {
            const error = new Error("Professional Tax slab not found.");
            error.statusCode = 404;
            error.errorCode = "PROFESSIONAL_TAX_NOT_FOUND";
            error.messageToShow = "Professional Tax slab not found.";
            throw error;
        }

        if (!pt.company || pt.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const result = pt.toJSON();
        delete result.company;
        return result;
    }

    /**
     * Updates an existing Professional Tax slab.
     */
    static async updateProfessionalTax(id, userId, updateData) {
        const pt = await ProfessionalTax.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!pt) {
            const error = new Error("Professional Tax slab not found.");
            error.statusCode = 404;
            error.errorCode = "PROFESSIONAL_TAX_NOT_FOUND";
            error.messageToShow = "Professional Tax slab not found.";
            throw error;
        }

        if (!pt.company || pt.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Validate overlap conflicts if slab constraints are modified
        if (
            updateData.start_date ||
            updateData.end_date ||
            updateData.from_amount !== undefined ||
            updateData.to_amount !== undefined
        ) {
            const newStartDate = updateData.start_date || pt.start_date;
            const newEndDate = updateData.end_date || pt.end_date;
            const newFromAmount = updateData.from_amount !== undefined ? updateData.from_amount : pt.from_amount;
            const newToAmount = updateData.to_amount !== undefined ? updateData.to_amount : pt.to_amount;

            await validateDatesAndSlabs(pt.company_id, newStartDate, newEndDate, newFromAmount, newToAmount, id);
        }

        // Perform the update
        await pt.update(updateData);

        return await ProfessionalTax.findByPk(id);
    }

    /**
     * Soft-deletes a Professional Tax slab.
     */
    static async deleteProfessionalTax(id, userId) {
        const pt = await ProfessionalTax.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!pt) {
            const error = new Error("Professional Tax slab not found.");
            error.statusCode = 404;
            error.errorCode = "PROFESSIONAL_TAX_NOT_FOUND";
            error.messageToShow = "Professional Tax slab not found.";
            throw error;
        }

        if (!pt.company || pt.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await pt.update({ status: false });
        return true;
    }
}

module.exports = ProfessionalTaxService;
