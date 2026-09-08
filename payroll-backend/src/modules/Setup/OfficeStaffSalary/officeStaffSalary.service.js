const { Op } = require("sequelize");
const OfficeStaffSalary = require("./officeStaffSalary.model");
const Company = require("../../Masters/Company/company.model");
const Employee = require("../../Masters/Employee/employee.model");

/**
 * Helper to verify company exists and user has access to it.
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

    const userId = typeof user === 'object' ? user?.id : user;
    const parentId = typeof user === 'object' ? user?.parent_id : null;
    const roleName = typeof user === 'object' ? user?.role_name : null;

    const isOwner = company.user_id === userId;
    const isParentOwner = parentId && company.user_id === parentId;
    const isSuperAdmin = roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN';

    if (!isOwner && !isParentOwner && !isSuperAdmin) {
        const error = new Error("Access denied.");
        error.statusCode = 403;
        error.errorCode = "ACCESS_DENIED";
        error.messageToShow = "Access denied.";
        throw error;
    }

    return company;
};

/**
 * Helper to verify employee exists and belongs to the company.
 */
const verifyEmployeeAssociation = async (employeeId, companyId) => {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) {
        const error = new Error("Employee not found.");
        error.statusCode = 404;
        error.errorCode = "EMPLOYEE_NOT_FOUND";
        error.messageToShow = "Employee not found or does not belong to this company.";
        throw error;
    }
    return employee;
};

/**
 * Validates start date is before end date and check for overlapping date periods for the same employee.
 */
const validateDatesAndOverlaps = async (employeeId, startDate, endDate, excludeId = null) => {
    if (new Date(startDate) > new Date(endDate)) {
        const error = new Error("Start date cannot be after end date.");
        error.statusCode = 400;
        error.errorCode = "INVALID_DATE_RANGE";
        error.messageToShow = "Start date cannot be after end date.";
        throw error;
    }

    const whereCondition = {
        employee_id: employeeId,
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

    const overlapping = await OfficeStaffSalary.findOne({ where: whereCondition });
    if (overlapping) {
        const error = new Error("Salary setup dates overlap with an existing setup.");
        error.statusCode = 400;
        error.errorCode = "OVERLAPPING_DATES";
        error.messageToShow = `The dates overlap with another active setup (${overlapping.start_date} to ${overlapping.end_date}) for this employee.`;
        throw error;
    }
};

class OfficeStaffSalaryService {
    /**
     * Creates a new Office Staff Salary Setup.
     */
    static async createOfficeStaffSalary(salaryData, user) {
        const { company_id, employee_id, start_date, end_date } = salaryData;

        // 1. Verify Company Access
        await verifyCompanyAccess(company_id, user);

        // 2. Verify Employee belongs to that Company
        await verifyEmployeeAssociation(employee_id, company_id);

        // 3. Validate dates and verify no overlapping periods
        await validateDatesAndOverlaps(employee_id, start_date, end_date);

        // 4. Create Setup
        const newSalarySetup = await OfficeStaffSalary.create(salaryData);

        return await OfficeStaffSalary.findOne({
            where: { id: newSalarySetup.id },
            include: [{ model: Employee, as: "employee", attributes: ["id", "name", "member_id"] }]
        });
    }

    /**
     * Retrieves all active Office Staff Salaries Setups for a specific company.
     */
    static async getAllOfficeStaffSalaries(companyId, user) {
        // Verify Company Access
        await verifyCompanyAccess(companyId, user);

        return await OfficeStaffSalary.findAll({
            where: { company_id: companyId, status: true },
            include: [
                {
                    model: Employee,
                    as: "employee",
                    attributes: ["id", "name", "member_id"],
                }
            ],
            order: [["start_date", "ASC"]],
        });
    }

    /**
     * Retrieves a single Office Staff Salary Setup by ID.
     */
    static async getOfficeStaffSalaryById(id, user) {
        const wage = await OfficeStaffSalary.findOne({
            where: { id, status: true },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "user_id"],
                },
                {
                    model: Employee,
                    as: "employee",
                    attributes: ["id", "name", "member_id"],
                }
            ],
        });

        if (!wage) {
            const error = new Error("Office Staff Salary setup not found.");
            error.statusCode = 404;
            error.errorCode = "OFFICE_STAFF_SALARY_NOT_FOUND";
            error.messageToShow = "Office Staff Salary setup not found.";
            throw error;
        }

        await verifyCompanyAccess(wage.company_id, user);

        return wage;
    }

    /**
     * Updates an existing Office Staff Salary Setup.
     */
    static async updateOfficeStaffSalary(id, user, updateData) {
        const wage = await OfficeStaffSalary.findOne({
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
            const error = new Error("Office Staff Salary setup not found.");
            error.statusCode = 404;
            error.errorCode = "OFFICE_STAFF_SALARY_NOT_FOUND";
            error.messageToShow = "Office Staff Salary setup not found.";
            throw error;
        }

        await verifyCompanyAccess(wage.company_id, user);

        // Validate employee association if employee_id changes
        if (updateData.employee_id && updateData.employee_id !== wage.employee_id) {
            await verifyEmployeeAssociation(updateData.employee_id, wage.company_id);
        }

        // Validate overlapping dates if they are being updated
        if (updateData.start_date || updateData.end_date || updateData.employee_id) {
            const targetEmployeeId = updateData.employee_id || wage.employee_id;
            const newStartDate = updateData.start_date || wage.start_date;
            const newEndDate = updateData.end_date || wage.end_date;
            await validateDatesAndOverlaps(targetEmployeeId, newStartDate, newEndDate, id);
        }

        // Perform the update
        await wage.update(updateData);

        return await OfficeStaffSalary.findOne({
            where: { id: wage.id },
            include: [{ model: Employee, as: "employee", attributes: ["id", "name", "member_id"] }]
        });
    }

    /**
     * Soft-deletes an Office Staff Salary Setup.
     */
    static async deleteOfficeStaffSalary(id, user) {
        const wage = await OfficeStaffSalary.findOne({
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
            const error = new Error("Office Staff Salary setup not found.");
            error.statusCode = 404;
            error.errorCode = "OFFICE_STAFF_SALARY_NOT_FOUND";
            error.messageToShow = "Office Staff Salary setup not found.";
            throw error;
        }

        await verifyCompanyAccess(wage.company_id, user);

        await wage.update({ status: false });
        return true;
    }
}

module.exports = OfficeStaffSalaryService;
