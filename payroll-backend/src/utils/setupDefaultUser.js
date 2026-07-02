const bcrypt = require("bcrypt");
const db = require("../database/models");

const ALL_PERMISSION_SLUGS = [
  'dashboard',
  'company', 'employee', 'kyc-update', 'contractor', 'address', 'leave-master',
  'packing-wages', 'bidi-roller-wages', 'professional-tax', 'office-staff-salary', 'challan-setup',
  'office-attendance', 'packing-attendance', 'bidi-roller-attendance',
  'office-staff', 'packers', 'bidi-roller', 'epf-challan-date', 'resignation',
  'salary-sheet', 'form-2', 'ecr-report', 'esic-report', 'pmrpy-report', 'pf-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 'bonus-sheet', 'gratuity-calculation', 'report-pt',
  'calender', 'user-management', 'employee-data-import', 'employee-data-export', 'kyc-export', 'attendance-printing', 'missing-information', 'delete-month-entry', 'backup', 'restore',
  '3-month-absent-list', '58-years-of-age', 'notes',
  'excel-to-text', 'loan-profile'
];

async function setupDefaultUser() {
    try {
        const permissions = {};
        ALL_PERMISSION_SLUGS.forEach(slug => {
            permissions[slug] = { read: true, create: true, edit: true, delete: true };
        });

        // 1. Ensure OWNER role exists
        let role = await db.Role.findOne({ where: { name: "OWNER" } });
        if (!role) {
            role = await db.Role.create({
                name: "OWNER",
                permissions: permissions,
                status: true
            });
        } else {
            // Update permissions just in case
            await role.update({ permissions: permissions });
        }

        // Ensure Contractor role exists automatically
        let contractorRole = await db.Role.findOne({ where: { name: "Contractor" } });
        if (!contractorRole) {
            await db.Role.create({
                name: "Contractor",
                permissions: {},
                status: true
            });
            console.log("Default role 'Contractor' created automatically.");
        }

        // 2. Check if user ally exists
        const user = await db.User.findOne({ where: { user_id: "ally" } });
        if (user) {
            console.log("admin already exist");
            // Optionally, ensure the user has the OWNER role
            if (user.role_id !== role.id) {
                await user.update({ role_id: role.id });
            }
        } else {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash("@lly4792", saltRounds);

            await db.User.create({
                user_name: "Super Admin",
                user_id: "ally",
                password: hashedPassword,
                role_id: role.id,
                status: true
            });
            console.log("Default admin user 'ally' created with OWNER role.");
        }
    } catch (error) {
        console.error("Failed to setup default user:", error);
    }
}

module.exports = setupDefaultUser;
