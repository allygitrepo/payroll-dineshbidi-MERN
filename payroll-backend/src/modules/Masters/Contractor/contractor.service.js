const { Op } = require("sequelize");
const Contractor = require("./contractor.model");
const Company = require("../Company/company.model");
const Address = require("../Address/address.model");

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
 * Helper to verify address exists and belongs to the company.
 */
const verifyAddressAssociation = async (addressId, companyId) => {
    const address = await Address.findOne({ where: { id: addressId, company_id: companyId, status: true } });
    if (!address) {
        const error = new Error("Address not found.");
        error.statusCode = 404;
        error.errorCode = "ADDRESS_NOT_FOUND";
        error.messageToShow = "Address not found or does not belong to this company.";
        throw error;
    }
    return address;
};

/**
 * Normalizes empty strings in optional fields to null to avoid unique constraint issues.
 */
const normalizeOptionalFields = (data) => {
    const fields = ["pan", "aadhar", "gst_no", "bank_ac", "bank_name", "ifsc"];
    fields.forEach(field => {
        if (data[field] === "" || data[field] === undefined || data[field] === null) {
            data[field] = null;
        } else if (typeof data[field] === "string") {
            data[field] = data[field].trim();
            // Uppercase document numbers for consistency
            if (["pan", "gst_no", "ifsc"].includes(field)) {
                data[field] = data[field].toUpperCase();
            }
        }
    });
};

/**
 * Validates document uniqueness across active contractors.
 */
const validateUniqueness = async (data, excludeId = null) => {
    const checkField = async (field, value, label) => {
        if (!value) return;

        const whereCondition = { [field]: value, status: true };
        if (excludeId) {
            whereCondition.id = { [Op.ne]: excludeId };
        }

        const existing = await Contractor.findOne({ where: whereCondition });
        if (existing) {
            const error = new Error(`${label} is already registered.`);
            error.statusCode = 400;
            error.errorCode = `DUPLICATE_${field.toUpperCase()}`;
            error.messageToShow = `${label} is already registered to another contractor.`;
            throw error;
        }
    };

    // Check ccode uniqueness
    await checkField("ccode", data.ccode, "Contractor Code");
    
    // Check PAN uniqueness
    await checkField("pan", data.pan, "PAN Number");

    // Check Aadhar uniqueness
    await checkField("aadhar", data.aadhar, "Aadhar Number");

    // Check GST No uniqueness
    await checkField("gst_no", data.gst_no, "GST Number");
};

class ContractorService {
    /**
     * Creates a new contractor.
     */
    static async createContractor(contractorData, userId) {
        const { company_id, address_id } = contractorData;

        // 1. Verify Company Ownership
        await verifyCompanyOwnership(company_id, userId);

        // 2. Verify Address belongs to that Company
        await verifyAddressAssociation(address_id, company_id);

        // 3. Normalize optional fields to null
        normalizeOptionalFields(contractorData);

        // 4. Validate uniqueness constraints for documents (ccode, pan, aadhar, gst_no)
        await validateUniqueness(contractorData);

        // 5. Create contractor
        const newContractor = await Contractor.create(contractorData);
        
        // Reload to include address details in response
        return await Contractor.findOne({
            where: { id: newContractor.id },
            include: [{ model: Address, as: "address" }]
        });
    }

    /**
     * Retrieves all active contractors for a specific company.
     */
    static async getAllContractors(companyId, userId) {
        // Verify company ownership
        await verifyCompanyOwnership(companyId, userId);

        return await Contractor.findAll({
            where: { company_id: companyId, status: true },
            include: [
                {
                    model: Address,
                    as: "address",
                }
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    /**
     * Retrieves a single contractor by ID.
     */
    static async getContractorById(id, userId) {
        const contractor = await Contractor.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
                {
                    model: Address,
                    as: "address",
                }
            ]
        });

        if (!contractor) {
            const error = new Error("Contractor not found.");
            error.statusCode = 404;
            error.errorCode = "CONTRACTOR_NOT_FOUND";
            error.messageToShow = "Contractor not found.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        return contractor;
    }

    /**
     * Updates an existing contractor.
     */
    static async updateContractor(id, userId, updateData) {
        const contractor = await Contractor.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                }
            ]
        });

        if (!contractor) {
            const error = new Error("Contractor not found.");
            error.statusCode = 404;
            error.errorCode = "CONTRACTOR_NOT_FOUND";
            error.messageToShow = "Contractor not found.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Verify updated address association if modified
        if (updateData.address_id && updateData.address_id !== contractor.address_id) {
            await verifyAddressAssociation(updateData.address_id, contractor.company_id);
        }

        // Normalize inputs
        normalizeOptionalFields(updateData);

        // Validate uniqueness constraints (excluding current contractor)
        await validateUniqueness(updateData, id);

        // Perform the update
        await contractor.update(updateData);

        // Reload updated details including address
        return await Contractor.findOne({
            where: { id: contractor.id },
            include: [{ model: Address, as: "address" }]
        });
    }

    /**
     * Soft-deletes a contractor.
     */
    static async deleteContractor(id, userId) {
        const contractor = await Contractor.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                }
            ]
        });

        if (!contractor) {
            const error = new Error("Contractor not found.");
            error.statusCode = 404;
            error.errorCode = "CONTRACTOR_NOT_FOUND";
            error.messageToShow = "Contractor not found.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await contractor.update({ status: false });
        return true;
    }
}

module.exports = ContractorService;
