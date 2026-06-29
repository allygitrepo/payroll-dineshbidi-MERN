const { Op } = require("sequelize");
const Contractor = require("./contractor.model");
const User = require("../../Auth/Users/users.model");
const Role = require("../../Auth/Users/roles.model");
const bcrypt = require("bcrypt");
const Company = require("../Company/company.model");
const Address = require("../Address/address.model");

/**
 * Helper to verify company exists and belongs to user.
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
    } else {
        if (company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
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
 * Normalizes empty strings to null and converts all strings to uppercase.
 */
const normalizeOptionalFields = (data) => {
    for (const key in data) {
        if (typeof data[key] === "string" && !key.toLowerCase().endsWith('id')) {
            data[key] = data[key].trim().toUpperCase();
            if (data[key] === "") {
                data[key] = null;
            }
        }
    }
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
    
    // Check name uniqueness
    await checkField("name", data.name, "Contractor Name");
    
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
    static async createContractor(contractorData, user) {
        const { company_id, address_id } = contractorData;

        // 1. Verify Company Ownership
        await verifyCompanyAccess(company_id, user);
        
        if (user.role_name === 'Contractor') {
            const error = new Error("Access denied. Contractors cannot create other contractors.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

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
    static async getAllContractors(companyId, user) {
        // Verify company ownership
        await verifyCompanyAccess(companyId, user);

        const whereClause = { company_id: companyId };
        if (user.role_name === 'Contractor' && user.contractor_id) {
            whereClause.id = user.contractor_id;
        }

        return await Contractor.findAll({
            where: whereClause,
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
    static async getContractorById(id, user) {
        const contractor = await Contractor.findOne({
            where: { id },
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

        if (user.role_name !== 'Contractor') {
            if (!contractor.company || contractor.company.user_id !== user.id) {
                const error = new Error("Access denied.");
                error.statusCode = 403;
                error.errorCode = "ACCESS_DENIED";
                error.messageToShow = "Access denied.";
                throw error;
            }
        } else {
            if (contractor.id !== user.contractor_id) {
                const error = new Error("Access denied.");
                error.statusCode = 403;
                error.errorCode = "ACCESS_DENIED";
                error.messageToShow = "Access denied.";
                throw error;
            }
        }

        return contractor;
    }

    /**
     * Updates an existing contractor.
     */
    static async updateContractor(id, user, updateData) {
        const contractor = await Contractor.findOne({
            where: { id },
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

        if (user.role_name === 'Contractor') {
            const error = new Error("Access denied. Contractors cannot update contractors.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== user.id) {
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
    static async deleteContractor(id, user) {
        const contractor = await Contractor.findOne({
            where: { id },
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

        if (user.role_name === 'Contractor') {
            const error = new Error("Access denied. Contractors cannot delete contractors.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await contractor.destroy();
        return true;
    }

    /**
     * Creates a user login for a contractor.
     */
    static async createLogin(contractorId, user, loginData) {
        const contractor = await Contractor.findOne({
            where: { id: contractorId, status: true },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }]
        });

        if (!contractor) {
            const error = new Error("Contractor not found.");
            error.statusCode = 404;
            error.errorCode = "CONTRACTOR_NOT_FOUND";
            error.messageToShow = "Contractor not found.";
            throw error;
        }

        if (user.role_name === 'Contractor') {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        // Check if user login already exists for this contractor
        const existingUser = await User.findOne({ where: { contractor_id: contractorId, status: true } });
        const { username, password } = loginData;

        if (existingUser) {
            if (existingUser.user_id !== username) {
                // Check if new username is taken
                const usernameExists = await User.findOne({ where: { user_id: username, status: true } });
                if (usernameExists) {
                    const error = new Error("Username is already taken.");
                    error.statusCode = 400;
                    error.errorCode = "USERNAME_TAKEN";
                    error.messageToShow = "Username is already taken. Please choose another.";
                    throw error;
                }
                existingUser.user_id = username;
            }
            if (password) {
                const saltRounds = 10;
                existingUser.password = await bcrypt.hash(password, saltRounds);
            }
            await existingUser.save();
            const userJson = existingUser.toJSON();
            delete userJson.password;
            return userJson;
        }
        
        // Check if username is taken
        const usernameExists = await User.findOne({ where: { user_id: username, status: true } });
        if (usernameExists) {
            const error = new Error("Username is already taken.");
            error.statusCode = 400;
            error.errorCode = "USERNAME_TAKEN";
            error.messageToShow = "Username is already taken. Please choose another.";
            throw error;
        }

        // Find CONTRACTOR role
        const role = await Role.findOne({ where: { name: 'Contractor' } });
        if (!role) {
            const error = new Error("Contractor role not found. Please run seeders.");
            error.statusCode = 500;
            error.errorCode = "ROLE_NOT_FOUND";
            error.messageToShow = "Internal configuration error. Contractor role not found.";
            throw error;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            user_name: contractor.name,
            user_id: username,
            password: hashedPassword,
            role_id: role.id,
            contractor_id: contractorId
        });

        const userJson = newUser.toJSON();
        delete userJson.password;
        return userJson;
    }

    /**
     * Gets the login details for a contractor.
     */
    static async getLogin(contractorId, user) {
        const contractor = await Contractor.findOne({
            where: { id: contractorId, status: true },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }]
        });

        if (!contractor) {
            const error = new Error("Contractor not found.");
            error.statusCode = 404;
            error.errorCode = "CONTRACTOR_NOT_FOUND";
            error.messageToShow = "Contractor not found.";
            throw error;
        }

        if (user.role_name === 'Contractor') {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        if (!contractor.company || contractor.company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const existingUser = await User.findOne({ 
            where: { contractor_id: contractorId, status: true },
            attributes: ['id', 'user_name', 'user_id']
        });

        return existingUser;
    }
}

module.exports = ContractorService;
