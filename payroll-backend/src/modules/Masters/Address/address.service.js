const Address = require("./address.model");
const Company = require("../Company/company.model");

/**
 * Helper to verify that a company exists and belongs to the authenticated user.
 */
const verifyCompanyAccess = async (companyId, user) => {
    const company = await Company.findOne({ where: { id: companyId, cstatus: true } });
    if (!company) {
        const error = new Error("Company not found.");
        error.statusCode = 404;
        error.errorCode = "COMPANY_NOT_FOUND";
        error.messageToShow = "Company not found.";
        throw error;
    }

    if (user.role_name === 'Contractor') {
        if (!user.contractor_id) {
            const error = new Error("Contractor profile not found.");
            error.statusCode = 403;
            error.errorCode = "CONTRACTOR_PROFILE_NOT_FOUND";
            error.messageToShow = "Contractor profile not found.";
            throw error;
        }
        const Contractor = require("../Contractor/contractor.model");
        const contractor = await Contractor.findOne({ where: { id: user.contractor_id, company_id: companyId, status: true } });
        if (!contractor) {
            const error = new Error("Access denied. Contractor does not belong to this company.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
    } else {
        const isOwner = company.user_id === user.id;
        const isParentOwner = user.parent_id && company.user_id === user.parent_id;
        const isSuperAdmin = user.role_name === 'SUPER ADMIN' || user.role_name === 'SUPER_ADMIN';

        if (!isOwner && !isParentOwner && !isSuperAdmin) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
    }

    return company;
};

class AddressService {
    /**
     * Creates a new address for a company.
     */
    static async createAddress(addressData, user) {
        // Convert all string fields to uppercase, but exclude IDs
        for (const key in addressData) {
            if (typeof addressData[key] === 'string' && !key.toLowerCase().endsWith('id')) {
                addressData[key] = addressData[key].toUpperCase();
            }
        }

        const { company_id } = addressData;
        await verifyCompanyAccess(company_id, user);

        const newAddress = await Address.create(addressData);
        return newAddress;
    }

    /**
     * Retrieves all active addresses for a specific company.
     */
    static async getAllAddresses(companyId, user) {
        await verifyCompanyAccess(companyId, user);

        const addresses = await Address.findAll({
            where: { company_id: companyId },
            order: [["createdAt", "DESC"]],
        });
        return addresses;
    }

    /**
     * Retrieves a single address by ID.
     */
    static async getAddressById(id, user) {
        const address = await Address.findOne({
            where: { id },
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

        if (user.role_name !== 'Contractor') {
            if (!address.company || address.company.user_id !== user.id) {
                const error = new Error("Access denied.");
                error.statusCode = 403;
                error.errorCode = "ACCESS_DENIED";
                error.messageToShow = "Access denied.";
                throw error;
            }
        }

        return address;
    }

    /**
     * Updates an existing address.
     */
    static async updateAddress(id, user, updateData) {
        const address = await Address.findOne({
            where: { id },
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

        if (user.role_name !== 'Contractor') {
            if (!address.company || address.company.user_id !== user.id) {
                const error = new Error("Access denied.");
                error.statusCode = 403;
                error.errorCode = "ACCESS_DENIED";
                error.messageToShow = "Access denied.";
                throw error;
            }
        }

        // Convert all string fields to uppercase, but exclude IDs
        for (const key in updateData) {
            if (typeof updateData[key] === 'string' && !key.toLowerCase().endsWith('id')) {
                updateData[key] = updateData[key].toUpperCase();
            }
        }

        // Perform the update
        await address.update(updateData);
        return address;
    }

    /**
     * Soft-deletes an address (sets status to false).
     */
    static async deleteAddress(id, user) {
        const address = await Address.findOne({
            where: { id },
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

        if (user.role_name !== 'Contractor') {
            if (!address.company || address.company.user_id !== user.id) {
                const error = new Error("Access denied.");
                error.statusCode = 403;
                error.errorCode = "ACCESS_DENIED";
                error.messageToShow = "Access denied.";
                throw error;
            }
        }

        await address.destroy();
        return true;
    }
}

module.exports = AddressService;
