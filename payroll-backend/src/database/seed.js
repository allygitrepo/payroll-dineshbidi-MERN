require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./models/index");

const seedUsers = async () => {
    try {
        console.log("Connecting to database...");
        await db.sequelize.authenticate();
        console.log("Database Connected. Syncing models...");
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.sequelize.sync({ alter: true });
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Cleaning up deprecated tables...");
        await db.sequelize.query("DROP TABLE IF EXISTS leave_masters");

        console.log("Seeding Employee Types...");
        const typeNames = ["BIDI PACKER", "BIDI MAKER", "OFFICE STAFF"];
        const empTypes = {};
        for (const name of typeNames) {
            let t = await db.EmployeeType.findOne({ where: { name } });
            if (!t) {
                t = await db.EmployeeType.create({ name, status: true });
                console.log(`Created Employee Type: ${name}`);
            }
            empTypes[name] = t;
        }

        // Map existing employees type ID
        console.log("Mapping employee type IDs...");
        const employees = await db.Employee.findAll();
        for (const emp of employees) {
            const mappedType = emp.employee_type ? emp.employee_type.toUpperCase().trim() : null;
            if (mappedType && empTypes[mappedType]) {
                await emp.update({ employee_type_id: empTypes[mappedType].id });
            }
        }

        console.log("Seeding Roles...");
        let adminRole = await db.Role.findOne({ where: { name: "Admin" } });
        if (!adminRole) {
            adminRole = await db.Role.create({
                name: "Admin",
                permissions: {
                    all: true,
                    full_access: true,
                    dashboard: ["read", "write", "update", "delete"],
                    users: ["create", "read", "update", "delete"],
                    roles: ["create", "read", "update", "delete"],
                    company: ["create", "read", "update", "delete"],
                    employee: ["create", "read", "update", "delete"],
                    contractor: ["create", "read", "update", "delete"],
                    attendance: ["create", "read", "update", "delete"],
                    setup: ["create", "read", "update", "delete"],
                    reports: ["read", "export"]
                },
                status: true
            });
            console.log("Created Admin role");
        }

        let userRole = await db.Role.findOne({ where: { name: "User" } });
        if (!userRole) {
            userRole = await db.Role.create({
                name: "User",
                permissions: {
                    dashboard: ["read"],
                    employee: ["read"],
                    attendance: ["read"]
                },
                status: true
            });
            console.log("Created User role");
        }

        console.log("Seeding sample users...");
        const saltRounds = 10;

        const sampleUsers = [
            {
                user_name: "System Admin",
                user_id: "admin01",
                password: "adminPassword123",
                role_id: adminRole.id,
            },
            {
                user_name: "HR Manager",
                user_id: "manager01",
                password: "managerPassword123",
                role_id: userRole.id,
            },
            {
                user_name: "Payroll Executive",
                user_id: "payroll01",
                password: "payrollPassword123",
                role_id: userRole.id,
            },
        ];

        for (const userData of sampleUsers) {
            // Check if user already exists
            const exists = await db.User.findOne({ where: { user_id: userData.user_id } });
            if (exists) {
                console.log(`User ${userData.user_id} already exists, updating role_id...`);
                await exists.update({ role_id: userData.role_id });
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Create user
            await db.User.create({
                user_name: userData.user_name,
                user_id: userData.user_id,
                password: hashedPassword,
                role_id: userData.role_id,
                status: true,
            });
            console.log(`Created user: ${userData.user_name} (${userData.user_id})`);
        }

        // Retrieve seeded user to associate companies
        const adminUser = await db.User.findOne({ where: { user_id: "admin01" } });
        if (!adminUser) {
            throw new Error("Admin user not found for seeding companies.");
        }

        console.log("Seeding sample companies...");
        const sampleCompanies = [
            {
                user_id: adminUser.id,
                establishment_id: "ALLYSOFTSOLUT01",
                company_name: "Ally Soft Solutions",
                company_type: "Private Limited",
                epfo_office: "Bangalore",
                lin_number: "1234567890",
                esic_id: "12345678901234567",
                address_line: "No 45, Residency Road",
                post_office: "Residency Road PO",
                district: "Bangalore Urban",
                pincode: "560025",
                pan: "ABCDE1234F",
                tan: "ABCD12345E",
                email_id: "info@allysoft.com",
                phone: "9876543210",
                cstatus: true
            },
            {
                user_id: adminUser.id,
                establishment_id: "DINESHBIDIWRK02",
                company_name: "Dinesh Bidi Works",
                company_type: "Proprietorship",
                epfo_office: "Mangalore",
                lin_number: "2234567890",
                esic_id: "22345678901234567",
                address_line: "Bidi Industrial Estate",
                post_office: "Kankanady PO",
                district: "Dakshina Kannada",
                pincode: "575002",
                pan: "FGHIJ5678K",
                tan: "FGHI56789J",
                email_id: "contact@dineshbidi.com",
                phone: "8765432109",
                cstatus: true
            },
            {
                user_id: adminUser.id,
                establishment_id: "DEMOCORPORATN03",
                company_name: "Demo Corporation",
                company_type: "Partnership",
                epfo_office: "Mumbai",
                lin_number: "3234567890",
                esic_id: "32345678901234567",
                address_line: "A/102 Corporate Plaza",
                post_office: "Bandra PO",
                district: "Mumbai Suburban",
                pincode: "400050",
                pan: "KLMNO9012P",
                tan: "KLMN90123O",
                email_id: "admin@democorp.com",
                phone: "7654321098",
                cstatus: true
            }
        ];

        for (const companyData of sampleCompanies) {
            const exists = await db.Company.findOne({ where: { establishment_id: companyData.establishment_id } });
            if (exists) {
                console.log(`Company ${companyData.company_name} already exists, skipping...`);
                continue;
            }
            await db.Company.create(companyData);
            console.log(`Created company: ${companyData.company_name}`);
        }

        const companies = await db.Company.findAll();
        for (const company of companies) {
            console.log(`Seeding Leave Types for ${company.company_name}...`);
            const defaultLeaveTypes = [
                { name: "Casual Leave", code: "CL", is_paid: true, half_day_allowed: true, requires_supporting_document: false, requires_approval: true },
                { name: "Sick Leave", code: "SL", is_paid: true, half_day_allowed: true, requires_supporting_document: false, requires_approval: true },
                { name: "Earned Leave", code: "EL", is_paid: true, half_day_allowed: false, requires_supporting_document: false, requires_approval: true },
                { name: "Leave Without Pay", code: "LWP", is_paid: false, half_day_allowed: true, requires_supporting_document: false, requires_approval: true },
                { name: "Comp Off", code: "COMP_OFF", is_paid: true, half_day_allowed: true, requires_supporting_document: false, requires_approval: true },
                { name: "Maternity Leave", code: "ML", is_paid: true, half_day_allowed: false, requires_supporting_document: true, requires_approval: true },
                { name: "Paternity Leave", code: "PL", is_paid: true, half_day_allowed: false, requires_supporting_document: true, requires_approval: true }
            ];

            const seededTypes = {};
            for (const lt of defaultLeaveTypes) {
                let typeObj = await db.LeaveType.findOne({ where: { company_id: company.id, code: lt.code } });
                if (!typeObj) {
                    typeObj = await db.LeaveType.create({ ...lt, company_id: company.id });
                    console.log(`Created Leave Type: ${lt.code} for company ${company.company_name}`);
                }
                seededTypes[lt.code] = typeObj;
            }

            console.log(`Seeding Leave Policies for ${company.company_name}...`);
            const officeStaffType = await db.EmployeeType.findOne({ where: { name: "OFFICE STAFF" } });
            const bidiMakerType = await db.EmployeeType.findOne({ where: { name: "BIDI MAKER" } });
            const bidiPackerType = await db.EmployeeType.findOne({ where: { name: "BIDI PACKER" } });

            if (officeStaffType) {
                const policies = [
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["CL"].id, yearly_allocation: 12.00, monthly_accrual_enabled: false },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["SL"].id, yearly_allocation: 10.00, monthly_accrual_enabled: false },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["EL"].id, yearly_allocation: 18.00, monthly_accrual_enabled: true, monthly_accrual_amount: 1.50, carry_forward_allowed: true, max_carry_forward: 5.00 },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["LWP"].id, yearly_allocation: 99.00, monthly_accrual_enabled: false },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["COMP_OFF"].id, yearly_allocation: 0.00, monthly_accrual_enabled: false },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["ML"].id, yearly_allocation: 180.00, monthly_accrual_enabled: false },
                    { employee_type_id: officeStaffType.id, leave_type_id: seededTypes["PL"].id, yearly_allocation: 15.00, monthly_accrual_enabled: false }
                ];
                for (const p of policies) {
                    await db.LeavePolicy.findOrCreate({
                        where: { company_id: company.id, employee_type_id: p.employee_type_id, leave_type_id: p.leave_type_id },
                        defaults: { ...p, company_id: company.id }
                    });
                }
            }

            if (bidiMakerType) {
                const policies = [
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["CL"].id, yearly_allocation: 12.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["SL"].id, yearly_allocation: 10.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["EL"].id, yearly_allocation: 12.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["LWP"].id, yearly_allocation: 99.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["COMP_OFF"].id, yearly_allocation: 0.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["ML"].id, yearly_allocation: 90.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiMakerType.id, leave_type_id: seededTypes["PL"].id, yearly_allocation: 5.00, monthly_accrual_enabled: false }
                ];
                for (const p of policies) {
                    await db.LeavePolicy.findOrCreate({
                        where: { company_id: company.id, employee_type_id: p.employee_type_id, leave_type_id: p.leave_type_id },
                        defaults: { ...p, company_id: company.id }
                    });
                }
            }

            if (bidiPackerType) {
                const policies = [
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["CL"].id, yearly_allocation: 12.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["SL"].id, yearly_allocation: 10.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["EL"].id, yearly_allocation: 12.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["LWP"].id, yearly_allocation: 99.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["COMP_OFF"].id, yearly_allocation: 0.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["ML"].id, yearly_allocation: 90.00, monthly_accrual_enabled: false },
                    { employee_type_id: bidiPackerType.id, leave_type_id: seededTypes["PL"].id, yearly_allocation: 5.00, monthly_accrual_enabled: false }
                ];
                for (const p of policies) {
                    await db.LeavePolicy.findOrCreate({
                        where: { company_id: company.id, employee_type_id: p.employee_type_id, leave_type_id: p.leave_type_id },
                        defaults: { ...p, company_id: company.id }
                    });
                }
            }
        }

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedUsers();
