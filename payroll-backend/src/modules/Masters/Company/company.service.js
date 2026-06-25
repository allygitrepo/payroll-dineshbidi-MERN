const Company = require("./company.model");

class CompanyService {
    /**
     * Creates a new company.
     */
    static async createCompany(companyData) {
        const { establishment_id } = companyData;

        // Check if company already exists
        const existingCompany = await Company.findOne({ where: { establishment_id, cstatus: true } });
        if (existingCompany) {
            const error = new Error("Establishment ID is already registered.");
            error.statusCode = 400;
            error.errorCode = "COMPANY_ALREADY_EXISTS";
            error.messageToShow = "Establishment ID is already registered.";
            throw error;
        }

        // Create the company
        const newCompany = await Company.create(companyData);
        return newCompany;
    }

    /**
     * Retrieves all active companies for the public login dropdown.
     */
    static async getPublicCompanies() {
        return await Company.findAll({
            where: { cstatus: true },
            attributes: ["id", "company_name"]
        });
    }

    /**
     * Retrieves all active companies.
     */
    static async getAllCompanies(userId) {
        return await Company.findAll({ where: { user_id: userId, cstatus: true } });
    }

    /**
     * Retrieves a single company by ID.
     */
    static async getCompanyById(id, userId) {
        const company = await Company.findOne({ where: { id, user_id: userId, cstatus: true } });
        if (!company) {
            const error = new Error("Company not found.");
            error.statusCode = 404;
            error.errorCode = "COMPANY_NOT_FOUND";
            error.messageToShow = "Company not found or access denied.";
            throw error;
        }
        return company;
    }

    /**
     * Updates an existing company's details.
     */
    static async updateCompany(id, userId, updateData) {
        const company = await Company.findOne({ where: { id, user_id: userId, cstatus: true } });
        if (!company) {
            const error = new Error("Company not found.");
            error.statusCode = 404;
            error.errorCode = "COMPANY_NOT_FOUND";
            error.messageToShow = "Company not found or access denied.";
            throw error;
        }

        // Check for duplicate establishment_id if it's being updated
        if (updateData.establishment_id && updateData.establishment_id !== company.establishment_id) {
            const conflictCompany = await Company.findOne({
                where: { establishment_id: updateData.establishment_id, cstatus: true },
            });
            if (conflictCompany) {
                const error = new Error("Establishment ID is already taken.");
                error.statusCode = 400;
                error.errorCode = "COMPANY_CONFLICT";
                error.messageToShow = "Establishment ID is already taken.";
                throw error;
            }
        }

        await company.update(updateData);
        return company;
    }

    /**
     * Soft-deletes a company (sets cstatus to false).
     */
    static async deleteCompany(id, userId) {
        const company = await Company.findOne({ where: { id, user_id: userId, cstatus: true } });
        if (!company) {
            const error = new Error("Company not found.");
            error.statusCode = 404;
            error.errorCode = "COMPANY_NOT_FOUND";
            error.messageToShow = "Company not found or access denied.";
            throw error;
        }

        await company.update({ cstatus: false });
        return true;
    }
}

module.exports = CompanyService;
