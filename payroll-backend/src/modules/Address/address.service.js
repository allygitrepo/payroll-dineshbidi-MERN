const Address = require("./address.model");
const Company = require("../Company/company.model");

/**
 * Helper to verify that a company exists and belongs to the authenticated user.
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

class AddressService {
    /**
     * Creates a new address for a company.
     */
    static async createAddress(addressData, userId) {
        const { company_id } = addressData;
        await verifyCompanyOwnership(company_id, userId);

        const newAddress = await Address.create(addressData);
        return newAddress;
    }

    /**
     * Retrieves all active addresses for a specific company.
     */
    static async getAllAddresses(companyId, userId) {
        await verifyCompanyOwnership(companyId, userId);

        const addresses = await Address.findAll({
            where: { company_id: companyId, status: true },
            order: [["created_at", "DESC"]],
        });
        return addresses;
    }

    /**
     * Retrieves a single address by ID.
     */
    static async getAddressById(id, userId) {
        const address = await Address.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!address) {
            const error = new Error("Address not found.");
            error.statusCode = 404;
            error.errorCode = "ADDRESS_NOT_FOUND";
            error.messageToShow = "Address not found.";
            throw error;
        }

        if (!address.company || address.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        return address;
    }

    /**
     * Updates an existing address.
     */
    static async updateAddress(id, userId, updateData) {
        const address = await Address.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!address) {
            const error = new Error("Address not found.");
            error.statusCode = 404;
            error.errorCode = "ADDRESS_NOT_FOUND";
            error.messageToShow = "Address not found.";
            throw error;
        }

        if (!address.company || address.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Perform the update
        await address.update(updateData);
        return address;
    }

    /**
     * Soft-deletes an address (sets status to false).
     */
    static async deleteAddress(id, userId) {
        const address = await Address.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
            ],
        });

        if (!address) {
            const error = new Error("Address not found.");
            error.statusCode = 404;
            error.errorCode = "ADDRESS_NOT_FOUND";
            error.messageToShow = "Address not found.";
            throw error;
        }

        if (!address.company || address.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await address.update({ status: false });
        return true;
    }
}

module.exports = AddressService;
