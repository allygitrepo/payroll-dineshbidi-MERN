const { Op } = require("sequelize");
const sequelize = require("../../../config/database");
const Employee = require("./employee.model");
const EmployeeKycDetail = require("./employeeKycDetail.model");
const EmployeeNomineeDetail = require("./employeeNomineeDetail.model");
const EmployeeFamilyMember = require("./employeeFamilyMember.model");
const Company = require("../Company/company.model");
const Address = require("../Address/address.model");
const Contractor = require("../Contractor/contractor.model");
const fs = require("fs");
const path = require("path");

/**
 * Saves a base64 image string to uploads/employee_image directory.
 * Returns the relative database path e.g. "uploads/employee_image/<employeeId>_<timestamp>.<ext>".
 */
const saveEmployeeImage = (base64Str, employeeId) => {
    if (!base64Str || !base64Str.startsWith("data:")) return null;

    try {
        const match = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
        const ext = match ? match[1] : "jpg";
        const filename = `${employeeId}_${Date.now()}.${ext}`;
        const dir = path.join(__dirname, "..", "..", "..", "..", "uploads", "employee_image");

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const base64Data = base64Str.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");
        fs.writeFileSync(path.join(dir, filename), base64Data, "base64");

        return `uploads/employee_image/${filename}`;
    } catch (error) {
        console.error("Error saving employee image:", error);
        throw new Error("Failed to save employee image to disk.");
    }
};

/**
 * Deletes an employee image from uploads/employee_image directory if it exists.
 */
const deleteEmployeeImage = (imagePath) => {
    if (!imagePath) return;
    try {
        const fullPath = path.join(__dirname, "..", "..", "..", "..", imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error(`Error deleting image at path ${imagePath}:`, error);
    }
};

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
        const contractor = await Contractor.findOne({ where: { id: user.contractor_id, company_id: companyId, status: true } });
        if (!contractor) {
            const error = new Error("Access denied. Contractor does not belong to this company.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
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
    if (!addressId) return null;
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
 * Helper to verify contractor exists and belongs to the company.
 */
const verifyContractorAssociation = async (contractorId, companyId) => {
    if (!contractorId) return null;
    const contractor = await Contractor.findOne({ where: { id: contractorId, company_id: companyId, status: true } });
    if (!contractor) {
        const error = new Error("Contractor not found.");
        error.statusCode = 404;
        error.errorCode = "CONTRACTOR_NOT_FOUND";
        error.messageToShow = "Contractor not found or does not belong to this company.";
        throw error;
    }
    return contractor;
};

/**
 * Validate uniqueness of UAN, IP Number, Aadhar, and PAN.
 */
const validateUniqueness = async (employeeData, excludeId = null) => {
    const { uan, ip_number, aadhar, kyc_details } = employeeData;

    const buildWhere = (field, val) => {
        const cond = { [field]: val, status: true };
        if (excludeId) {
            cond.id = { [Op.ne]: excludeId };
        }
        return cond;
    };

    // Check UAN
    if (uan) {
        const existing = await Employee.findOne({ where: buildWhere("uan", uan) });
        if (existing) {
            const error = new Error("UAN number is already registered.");
            error.statusCode = 400;
            error.errorCode = "DUPLICATE_UAN";
            error.messageToShow = "UAN number is already registered to another employee.";
            throw error;
        }
    }

    // Check IP Number
    if (ip_number) {
        const existing = await Employee.findOne({ where: buildWhere("ip_number", ip_number) });
        if (existing) {
            const error = new Error("IP Number is already registered.");
            error.statusCode = 400;
            error.errorCode = "DUPLICATE_IP_NUMBER";
            error.messageToShow = "IP Number is already registered to another employee.";
            throw error;
        }
    }

    // Check Aadhar
    if (aadhar) {
        const existing = await Employee.findOne({ where: buildWhere("aadhar", aadhar) });
        if (existing) {
            const error = new Error("Aadhar number is already registered.");
            error.statusCode = 400;
            error.errorCode = "DUPLICATE_AADHAR";
            error.messageToShow = "Aadhar card number is already registered to another employee.";
            throw error;
        }
    }

    // Check PAN
    if (kyc_details && kyc_details.pan) {
        const panVal = kyc_details.pan.trim().toUpperCase();
        const buildKycWhere = () => {
            const cond = { pan: panVal, status: true };
            if (excludeId) {
                cond.employee_id = { [Op.ne]: excludeId };
            }
            return cond;
        };

        const existingKyc = await EmployeeKycDetail.findOne({ where: buildKycWhere() });
        if (existingKyc) {
            const error = new Error("PAN is already registered.");
            error.statusCode = 400;
            error.errorCode = "DUPLICATE_PAN";
            error.messageToShow = "PAN is already registered to another employee.";
            throw error;
        }
    }
};

class EmployeeService {
    /**
     * Creates a new employee master record spanning all 4 tables inside a database transaction.
     */
    static async createEmployee(employeeData, user) {
        const {
            company_id,
            address_id,
            contractor_id,
            kyc_details,
            nominees,
            family_members,
            ...personalDetails
        } = employeeData;

        const incomingImagePath = personalDetails.image_path;
        if (incomingImagePath && incomingImagePath.startsWith("data:")) {
            personalDetails.image_path = null;
        }

        let normalizedAddressId = address_id || null;
        if (normalizedAddressId === "") normalizedAddressId = null;

        let normalizedContractorId = contractor_id || null;
        if (normalizedContractorId === "" || normalizedContractorId === "SELF") normalizedContractorId = null;

        // If the user is a contractor, strictly enforce their contractor_id
        if (user.role_name === 'Contractor' && user.contractor_id) {
            normalizedContractorId = user.contractor_id;
        }

        // 1. Verify Company, Address, and Contractor
        await verifyCompanyAccess(company_id, user);
        await verifyAddressAssociation(normalizedAddressId, company_id);
        await verifyContractorAssociation(normalizedContractorId, company_id);

        // 2. Validate Uniqueness
        await validateUniqueness({ ...employeeData, contractor_id: normalizedContractorId });

        // 3. Normalize strings (Uppercase Enforcement & ID lowercase normalization)
        const toUpper = (obj) => {
            if (!obj) return;
            for (const key in obj) {
                if (typeof obj[key] === 'string' && key !== 'image_path' && key !== 'email' && !key.toLowerCase().endsWith('id')) {
                    obj[key] = obj[key].toUpperCase();
                }
            }
        };

        toUpper(personalDetails);
        if (kyc_details) toUpper(kyc_details);
        if (nominees && Array.isArray(nominees)) nominees.forEach(toUpper);
        if (family_members && Array.isArray(family_members)) family_members.forEach(toUpper);

        // Execute as a database transaction
        const t = await sequelize.transaction();

        try {
            // Create Employee
            const newEmployee = await Employee.create(
                {
                    ...personalDetails,
                    company_id,
                    address_id: normalizedAddressId,
                    contractor_id: normalizedContractorId,
                },
                { transaction: t }
            );

            const employeeId = newEmployee.id;

            if (incomingImagePath && incomingImagePath.startsWith("data:")) {
                const savedPath = saveEmployeeImage(incomingImagePath, employeeId);
                if (savedPath) {
                    await newEmployee.update({ image_path: savedPath }, { transaction: t });
                }
            }

            // Create KYC Details
            const kycPayload = {
                employee_id: employeeId,
                company_id,
                pan: kyc_details?.pan || null,
                bank_ac: kyc_details?.bank_ac || null,
                bank_name: kyc_details?.bank_name || null,
                ifsc: kyc_details?.ifsc || null,
            };
            await EmployeeKycDetail.create(kycPayload, { transaction: t });

            // Create Nominees
            if (nominees && nominees.length > 0) {
                const nomineesPayload = nominees.map((nom) => ({
                    employee_id: employeeId,
                    company_id,
                    address_id: nom.address_id,
                    name: nom.name,
                    aadhar: nom.aadhar,
                    relation: nom.relation,
                    dob: nom.dob,
                    share_percentage: nom.share_percentage,
                    guardian_name: nom.guardian_name || null,
                    guardian_address: nom.guardian_address || null,
                }));
                await EmployeeNomineeDetail.bulkCreate(nomineesPayload, { transaction: t });
            }

            // Create Family Members
            if (family_members && family_members.length > 0) {
                const familyPayload = family_members.map((fam) => ({
                    employee_id: employeeId,
                    company_id,
                    relation: fam.relation,
                    name: fam.name,
                    dob: fam.dob,
                    aadhar: fam.aadhar,
                }));
                await EmployeeFamilyMember.bulkCreate(familyPayload, { transaction: t });
            }

            await t.commit();

            try {
                const LeaveBalanceService = require("../../Attendance/Leave/leaveBalance.service");
                await LeaveBalanceService.autoAllocateForEmployee(newEmployee);
            } catch (errAlloc) {
                console.error("Auto balance allocation failed for employee:", errAlloc);
            }

            return await EmployeeService.getEmployeeById(employeeId, user);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Retrieves all employees for a company with pagination, filtering, and search.
     */
    static async getAllEmployees(companyId, user, options = {}) {
        await verifyCompanyAccess(companyId, user);

        const { page, limit, search, status, employeeType } = options;

        const whereClause = { company_id: companyId };
        
        if (user.role_name === 'Contractor' && user.contractor_id) {
            whereClause.contractor_id = user.contractor_id;
        }

        if (status !== undefined && status !== '') {
            whereClause.status = status === '1' || status === 'true' || status === true;
        }

        if (employeeType) {
            whereClause.employee_type = employeeType;
        }

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { uan: { [Op.like]: `%${search}%` } },
                { ip_number: { [Op.like]: `%${search}%` } },
                { aadhar: { [Op.like]: `%${search}%` } }
            ];
        }

        const queryOptions = {
            where: whereClause,
            include: [
                { model: EmployeeKycDetail, as: "kycDetail", where: { status: true }, required: false },
                { model: EmployeeNomineeDetail, as: "nomineeDetails", where: { status: true }, required: false },
                { model: EmployeeFamilyMember, as: "familyMembers", where: { status: true }, required: false },
                { model: Address, as: "address" },
                { model: Contractor, as: "contractor", required: false },
            ],
            order: [["createdAt", "DESC"]],
        };

        if (page && limit) {
            const pageNumber = parseInt(page, 10) || 1;
            const pageSize = parseInt(limit, 10) || 20;
            const offset = (pageNumber - 1) * pageSize;
            
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;

            const { count, rows } = await Employee.findAndCountAll(queryOptions);
            return {
                rows,
                total: count,
                totalPages: Math.ceil(count / pageSize),
                currentPage: pageNumber
            };
        }

        // Return array directly if no pagination
        const rows = await Employee.findAll(queryOptions);
        return {
            rows,
            total: rows.length,
            totalPages: 1,
            currentPage: 1
        };
    }

    /**
     * Gets employees missing requested details dynamically.
     */
    static async getMissingDetails(companyId, fieldsStr, user) {
        await verifyCompanyAccess(companyId, user);

        const fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim().toLowerCase()) : [];
        if (fields.length === 0) return [];

        const whereClause = { company_id: companyId, status: true };
        if (user.role_name === 'Contractor' && user.contractor_id) {
            whereClause.contractor_id = user.contractor_id;
        }

        const employees = await Employee.findAll({
            where: whereClause,
            include: [
                { model: EmployeeKycDetail, as: "kycDetail", where: { status: true }, required: false },
            ],
            order: [["createdAt", "DESC"]],
        });

        const processed = employees.map(emp => {
            const missing = [];
            const empData = emp.toJSON();
            const kyc = empData.kycDetail || {};

            if (fields.includes('name') && (!empData.name || empData.name === 'NOT AVAILABLE')) missing.push('Name');
            if (fields.includes('dob') && (!empData.dob || empData.dob === '0000-00-00')) missing.push('Dob');
            if (fields.includes('doj') && (!empData.date_of_joining || empData.date_of_joining === '0000-00-00')) missing.push('Doj');
            if (fields.includes('gender') && !empData.gender) missing.push('Gender');
            if (fields.includes('relation') && !empData.relation) missing.push('Relation');
            if (fields.includes('marital status') && !empData.marital_status) missing.push('Marital Status');
            if (fields.includes('qualification') && !empData.qualification) missing.push('Qualification');
            if (fields.includes('aadhaar kyc') && !empData.aadhar) missing.push('AADHAAR KYC');
            if (fields.includes('pan kyc') && !kyc.pan) missing.push('PAN KYC');
            if (fields.includes('bank kyc') && !kyc.bank_ac) missing.push('BANK KYC');

            return { ...empData, missingFields: missing };
        });

        return processed.filter(emp => emp.missingFields.length > 0);
    }

    /**
     * Retrieves a single employee by ID.
     */
    static async getEmployeeById(id, user) {
        const employee = await Employee.findOne({
            where: { id },
            include: [
                { model: Company, as: "company", attributes: ["id", "user_id"] },
                { model: EmployeeKycDetail, as: "kycDetail", where: { status: true }, required: false },
                { model: EmployeeNomineeDetail, as: "nomineeDetails", where: { status: true }, required: false },
                { model: EmployeeFamilyMember, as: "familyMembers", where: { status: true }, required: false },
                { model: Address, as: "address" },
                { model: Contractor, as: "contractor", required: false },
            ],
        });

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        // Check if user has access to this employee's company
        await verifyCompanyAccess(employee.company_id, user);

        // If contractor, check if this employee belongs to them
        if (user.role_name === 'Contractor' && user.contractor_id && employee.contractor_id !== user.contractor_id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        return employee;
    }

    /**
     * Updates an employee and related KYC, Nominees, and Family Members details in a transaction.
     */
    static async updateEmployee(id, user, updateData) {
        const employee = await Employee.findOne({
            where: { id },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }],
        });

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        await verifyCompanyAccess(employee.company_id, user);

        if (user.role_name === 'Contractor' && user.contractor_id && employee.contractor_id !== user.contractor_id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const {
            kyc_details,
            nominees,
            family_members,
            ...personalDetails
        } = updateData;

        if (personalDetails.image_path !== undefined) {
            const existingImagePath = employee.image_path;
            let newImagePath = personalDetails.image_path;

            if (newImagePath && newImagePath.startsWith("data:")) {
                if (existingImagePath) {
                    deleteEmployeeImage(existingImagePath);
                }
                newImagePath = saveEmployeeImage(newImagePath, id);
                personalDetails.image_path = newImagePath;
            } else if (newImagePath === "" || newImagePath === null) {
                if (existingImagePath) {
                    deleteEmployeeImage(existingImagePath);
                }
                personalDetails.image_path = null;
            }
        }

        // Verify updated contractor / address if provided
        if (personalDetails.address_id === "") {
            personalDetails.address_id = null;
        }
        if (personalDetails.address_id !== undefined && personalDetails.address_id !== employee.address_id) {
            await verifyAddressAssociation(personalDetails.address_id, employee.company_id);
        }

        // Strictly enforce contractor_id for Contractors
        if (user.role_name === 'Contractor' && user.contractor_id) {
            personalDetails.contractor_id = user.contractor_id;
        }

        if (personalDetails.contractor_id === "" || personalDetails.contractor_id === "SELF") {
            personalDetails.contractor_id = null;
        }
        if (personalDetails.contractor_id !== undefined && personalDetails.contractor_id !== employee.contractor_id) {
            await verifyContractorAssociation(personalDetails.contractor_id, employee.company_id);
        }

        // Validate uniqueness excluding this employee
        await validateUniqueness({ ...employee.toJSON(), ...updateData }, id);

        // Normalize strings (Uppercase Enforcement & ID lowercase normalization)
        const toUpper = (obj) => {
            if (!obj) return;
            for (const key in obj) {
                if (typeof obj[key] === 'string' && key !== 'image_path' && key !== 'email' && !key.toLowerCase().endsWith('id')) {
                    obj[key] = obj[key].toUpperCase();
                }
            }
        };

        toUpper(personalDetails);
        if (kyc_details) toUpper(kyc_details);
        if (nominees && Array.isArray(nominees)) nominees.forEach(toUpper);
        if (family_members && Array.isArray(family_members)) family_members.forEach(toUpper);

        const t = await sequelize.transaction();

        try {
            // 1. Update personal details
            await employee.update(personalDetails, { transaction: t });

            // 2. Update KYC detail
            if (kyc_details) {
                const kyc = await EmployeeKycDetail.findOne({ where: { employee_id: id, status: true } });
                if (kyc) {
                    await kyc.update(
                        {
                            pan: kyc_details.pan !== undefined ? kyc_details.pan : kyc.pan,
                            bank_ac: kyc_details.bank_ac !== undefined ? kyc_details.bank_ac : kyc.bank_ac,
                            bank_name: kyc_details.bank_name !== undefined ? kyc_details.bank_name : kyc.bank_name,
                            ifsc: kyc_details.ifsc !== undefined ? kyc_details.ifsc : kyc.ifsc,
                        },
                        { transaction: t }
                    );
                } else {
                    await EmployeeKycDetail.create(
                        {
                            employee_id: id,
                            company_id: employee.company_id,
                            pan: kyc_details.pan || null,
                            bank_ac: kyc_details.bank_ac || null,
                            bank_name: kyc_details.bank_name || null,
                            ifsc: kyc_details.ifsc || null,
                        },
                        { transaction: t }
                    );
                }
            }

            // 3. Re-sync Nominees (delete existing and insert new ones to avoid complex updates)
            if (nominees) {
                await EmployeeNomineeDetail.destroy({ where: { employee_id: id }, transaction: t });
                if (nominees.length > 0) {
                    const nomineesPayload = nominees.map((nom) => ({
                        employee_id: id,
                        company_id: employee.company_id,
                        address_id: nom.address_id,
                        name: nom.name,
                        aadhar: nom.aadhar,
                        relation: nom.relation,
                        dob: nom.dob,
                        share_percentage: nom.share_percentage,
                        guardian_name: nom.guardian_name || null,
                        guardian_address: nom.guardian_address || null,
                    }));
                    await EmployeeNomineeDetail.bulkCreate(nomineesPayload, { transaction: t });
                }
            }

            // 4. Re-sync Family Members
            if (family_members) {
                await EmployeeFamilyMember.destroy({ where: { employee_id: id }, transaction: t });
                if (family_members.length > 0) {
                    const familyPayload = family_members.map((fam) => ({
                        employee_id: id,
                        company_id: employee.company_id,
                        relation: fam.relation,
                        name: fam.name,
                        dob: fam.dob,
                        aadhar: fam.aadhar,
                    }));
                    await EmployeeFamilyMember.bulkCreate(familyPayload, { transaction: t });
                }
            }

            await t.commit();

            // Sync updated name into face_data json profile if face biometrics are enrolled
            if (personalDetails.name) {
                const fs = require("fs");
                const path = require("path");
                try {
                    const faceDataDir = path.join(__dirname, "..", "..", "..", "..", "face_data");
                    const filePath = path.join(faceDataDir, `${id}.json`);
                    if (fs.existsSync(filePath)) {
                        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
                        fileData.name = personalDetails.name;
                        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
                    }
                } catch (e) {
                    console.warn("Failed to synchronize employee name in face profile:", e.message);
                }
            }

            return await EmployeeService.getEmployeeById(id, user);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Soft-deletes employee and related details.
     */
    static async deleteEmployee(id, user) {
        const employee = await Employee.findOne({
            where: { id },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }],
        });

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        await verifyCompanyAccess(employee.company_id, user);

        if (user.role_name === 'Contractor' && user.contractor_id && employee.contractor_id !== user.contractor_id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const t = await sequelize.transaction();

        try {
            // Hard delete Employee
            await employee.destroy({ transaction: t });

            // Hard delete KYC details
            await EmployeeKycDetail.destroy({ where: { employee_id: id }, transaction: t });

            // Hard delete Nominee Details
            await EmployeeNomineeDetail.destroy({ where: { employee_id: id }, transaction: t });

            // Hard delete Family members
            await EmployeeFamilyMember.destroy({ where: { employee_id: id }, transaction: t });

            await t.commit();

            // Delete biometric face data JSON file if it exists (outside transaction after commit)
            try {
                const faceDataDir = path.join(__dirname, "..", "..", "..", "..", "face_data");
                const filePath = path.join(faceDataDir, `${id}.json`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Successfully deleted face data file: ${filePath}`);
                }
            } catch (fsErr) {
                console.warn(`Failed to clean up face data file for employee ${id}:`, fsErr.message);
            }

            return true;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = EmployeeService;
