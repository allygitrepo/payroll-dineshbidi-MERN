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
    static async createEmployee(employeeData, userId) {
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

        // 1. Verify Company, Address, and Contractor
        await verifyCompanyOwnership(company_id, userId);
        await verifyAddressAssociation(address_id, company_id);
        await verifyContractorAssociation(contractor_id, company_id);

        // 2. Validate Uniqueness
        await validateUniqueness(employeeData);

        // 3. Normalize strings
        if (kyc_details) {
            if (kyc_details.pan) kyc_details.pan = kyc_details.pan.trim().toUpperCase();
            if (kyc_details.ifsc) kyc_details.ifsc = kyc_details.ifsc.trim().toUpperCase();
            if (kyc_details.bank_ac) kyc_details.bank_ac = kyc_details.bank_ac.trim();
        }

        // Execute as a database transaction
        const t = await sequelize.transaction();

        try {
            // Create Employee
            const newEmployee = await Employee.create(
                {
                    ...personalDetails,
                    company_id,
                    address_id,
                    contractor_id,
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

            return await EmployeeService.getEmployeeById(employeeId, userId);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Retrieves all active employees for a company.
     */
    static async getAllEmployees(companyId, userId) {
        await verifyCompanyOwnership(companyId, userId);

        return await Employee.findAll({
            where: { company_id: companyId, status: true },
            include: [
                { model: EmployeeKycDetail, as: "kycDetail", where: { status: true }, required: false },
                { model: EmployeeNomineeDetail, as: "nomineeDetails", where: { status: true }, required: false },
                { model: EmployeeFamilyMember, as: "familyMembers", where: { status: true }, required: false },
                { model: Address, as: "address" },
                { model: Contractor, as: "contractor", required: false },
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    /**
     * Retrieves a single employee by ID.
     */
    static async getEmployeeById(id, userId) {
        const employee = await Employee.findOne({
            where: { id, status: true },
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

        if (!employee.company || employee.company.user_id !== userId) {
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
    static async updateEmployee(id, userId, updateData) {
        const employee = await Employee.findOne({
            where: { id, status: true },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }],
        });

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        if (!employee.company || employee.company.user_id !== userId) {
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
        if (personalDetails.address_id && personalDetails.address_id !== employee.address_id) {
            await verifyAddressAssociation(personalDetails.address_id, employee.company_id);
        }
        if (personalDetails.contractor_id && personalDetails.contractor_id !== employee.contractor_id) {
            await verifyContractorAssociation(personalDetails.contractor_id, employee.company_id);
        }

        // Validate uniqueness excluding this employee
        await validateUniqueness({ ...employee.toJSON(), ...updateData }, id);

        // Normalize
        if (kyc_details) {
            if (kyc_details.pan) kyc_details.pan = kyc_details.pan.trim().toUpperCase();
            if (kyc_details.ifsc) kyc_details.ifsc = kyc_details.ifsc.trim().toUpperCase();
            if (kyc_details.bank_ac) kyc_details.bank_ac = kyc_details.bank_ac.trim();
        }

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

            return await EmployeeService.getEmployeeById(id, userId);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    /**
     * Soft-deletes employee and related details.
     */
    static async deleteEmployee(id, userId) {
        const employee = await Employee.findOne({
            where: { id, status: true },
            include: [{ model: Company, as: "company", attributes: ["id", "user_id"] }],
        });

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        if (!employee.company || employee.company.user_id !== userId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const t = await sequelize.transaction();

        try {
            // Soft delete Employee
            await employee.update({ status: false }, { transaction: t });

            // Soft delete KYC details
            await EmployeeKycDetail.update({ status: false }, { where: { employee_id: id }, transaction: t });

            // Soft delete Nominee Details
            await EmployeeNomineeDetail.update({ status: false }, { where: { employee_id: id }, transaction: t });

            // Soft delete Family members
            await EmployeeFamilyMember.update({ status: false }, { where: { employee_id: id }, transaction: t });

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
