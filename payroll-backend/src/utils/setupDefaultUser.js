const bcrypt = require("bcrypt");
const db = require("../database/models");

const ALL_PERMISSION_SLUGS = [
  'dashboard',
  // Master
  'company', 'employee', 'kyc-update', 'contractor', 'address', 'leave',
  // Setup
  'packing-wages', 'bidi-roller-wages', 'professional-tax', 'office-staff-salary', 'challan-setup',
  // Attendance
  'attendence-list', 'leave-management', 'face-attendance-self',
  // Entry
  'office-staff', 'packers', 'bidi-roller', 'epf-challan-date', 'resignation',
  // Report
  'salary-sheet', 'office-salary', 'packing-salary', 'contractor-salary',
  'forms', 'form-2', 'form-3a', 'form-5', 'form-10', 'form-11', 'pf-claim-form',
  'ecr-report', 'esic-report', 'pmrpy-report', 'pf-challan-yearly', 'esic-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 'bonus-sheet', 'gratuity-calculation', 'report-pt',
  // Utility
  'calender', 'user-management', 'whatsapp-gateway', 'employee-data-import', 'employee-data-export', 'kyc-export', 'attendance-printing', 'missing-information', 'delete-month-entry', 'backup', 'restore', 'uan-to-ip-mapping',
  // Todo List
  '3-month-absent-list', '58-years-of-age', 'notes',
  // Convert Excel To Text
  'excel-to-text',
  // Loan Management
  'loan-profile'
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

        // 1b. Ensure Contractor role exists
        let contractorRole = await db.Role.findOne({ where: { name: "Contractor" } });
        if (!contractorRole) {
            contractorRole = await db.Role.create({
                name: "Contractor",
                permissions: permissions,
                status: true
            });
        } else {
            // Update permissions just in case
            await contractorRole.update({ permissions: permissions });
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
