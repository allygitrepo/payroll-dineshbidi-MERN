const sequelize = require("../../config/database");
const User = require("../../modules/Auth/Users/users.model");
const RefreshToken = require("../../modules/Auth/RefreshTokens/refreshTokens.model");
const Role = require("../../modules/Auth/Users/roles.model");
const Company = require("../../modules/Masters/Company/company.model");
const Address = require("../../modules/Masters/Address/address.model");
const Contractor = require("../../modules/Masters/Contractor/contractor.model");
const Employee = require("../../modules/Masters/Employee/employee.model");
const EmployeeKycDetail = require("../../modules/Masters/Employee/employeeKycDetail.model");
const EmployeeNomineeDetail = require("../../modules/Masters/Employee/employeeNomineeDetail.model");
const EmployeeFamilyMember = require("../../modules/Masters/Employee/employeeFamilyMember.model");
const Attendance = require("../../modules/Attendance/attendance.model");
const LeaveRequest = require("../../modules/Attendance/Leave/leaveRequest.model");
const ChallanSetup = require("../../modules/Setup/ChallanSetup/challanSetup.model");
const ProfessionalTax = require("../../modules/Setup/ProfessionalTax/professionalTax.model");
const BidiRollerWage = require("../../modules/Setup/BidiRollerWage/bidiRollerWage.model");
const OfficeStaffSalary = require("../../modules/Setup/OfficeStaffSalary/officeStaffSalary.model");
const PackingWage = require("../../modules/Setup/PackingWage/packingWage.model");
const Calender = require("../../modules/Setup/Calender/calender.model");
const OfficeStaffEntry = require("../../modules/Entry/OfficeStaffEntry/officeStaffEntry.model");
const PackersEntry = require("../../modules/Entry/PackersEntry/packersEntry.model");
const BidiRollerEntry = require("../../modules/Entry/BidiRollerEntry/bidiRollerEntry.model");
const ChallanDateEntry = require("../../modules/Entry/ChallanDateEntry/challanDateEntry.model");
const Resignation = require("../../modules/Entry/Resignation/resignation.model");
const Note = require("../../modules/Todo List/Note/note.model");
// const LeaveMaster = require("../../modules/Setup/LeaveMaster/leaveMaster.model");
const Loan = require("../../modules/Loan/loan.model");
const LoanTransaction = require("../../modules/Loan/loanTransaction.model");
const LeaveType = require("../../modules/Setup/LeaveMaster/leaveType.model");
const LeavePolicy = require("../../modules/Setup/LeaveMaster/leavePolicy.model");
const LeaveBalance = require("../../modules/Attendance/Leave/leaveBalance.model");
const LeaveTransaction = require("../../modules/Attendance/Leave/leaveTransaction.model");
const WhatsAppInstance = require("../../modules/Setup/WhatsApp/whatsAppInstance.model");
const WhatsAppTemplate = require("../../modules/Setup/WhatsApp/whatsappTemplate.model");

// Registry object to hold Sequelize, Sequelize constructors, and model definitions
const db = {};

// Attach the configured Sequelize client instance
db.sequelize = sequelize;

// Register models
db.User = User;
db.RefreshToken = RefreshToken;
db.Role = Role;
db.Company = Company;
db.Address = Address;
db.Contractor = Contractor;
db.Employee = Employee;
db.EmployeeKycDetail = EmployeeKycDetail;
db.EmployeeNomineeDetail = EmployeeNomineeDetail;
db.EmployeeFamilyMember = EmployeeFamilyMember;
db.Attendance = Attendance;
db.LeaveRequest = LeaveRequest;
db.ChallanSetup = ChallanSetup;
db.ProfessionalTax = ProfessionalTax;
db.BidiRollerWage = BidiRollerWage;
db.PackingWage = PackingWage;
db.OfficeStaffSalary = OfficeStaffSalary;
db.Calender = Calender;
db.OfficeStaffEntry = OfficeStaffEntry;
db.PackersEntry = PackersEntry;
db.BidiRollerEntry = BidiRollerEntry;
db.ChallanDateEntry = ChallanDateEntry;
db.Resignation = Resignation;
db.Note = Note;
db.LeaveType = LeaveType;
db.LeavePolicy = LeavePolicy;
db.LeaveBalance = LeaveBalance;
db.LeaveTransaction = LeaveTransaction;
db.Loan = Loan;
db.LoanTransaction = LoanTransaction;
db.WhatsAppInstance = WhatsAppInstance;
db.WhatsAppTemplate = WhatsAppTemplate;


// Model associations

// Users <-> Roles
db.Role.hasMany(db.User, {
    foreignKey: "role_id",
    as: "users",
});
db.User.belongsTo(db.Role, {
    foreignKey: "role_id",
    as: "role",
});

db.User.hasMany(db.User, {
    foreignKey: "parent_id",
    as: "staff",
});
db.User.belongsTo(db.User, {
    foreignKey: "parent_id",
    as: "creator",
});

db.User.hasMany(db.RefreshToken, {
    foreignKey: "user_id",
    as: "refreshTokens",
    onDelete: "CASCADE",
});
db.RefreshToken.belongsTo(db.User, {
    foreignKey: "user_id",
    as: "user",
});

db.User.belongsTo(db.Contractor, {
    foreignKey: "contractor_id",
    as: "contractor_profile",
});
db.Contractor.hasOne(db.User, {
    foreignKey: "contractor_id",
    as: "user_account",
});

db.User.hasMany(db.Company, {
    foreignKey: "user_id",
    as: "companies",
    onDelete: "CASCADE",
});
db.Company.belongsTo(db.User, {
    foreignKey: "user_id",
    as: "user",
});

db.Company.hasMany(db.Address, {
    foreignKey: "company_id",
    as: "addresses",
    onDelete: "CASCADE",
});
db.Address.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Company.hasMany(db.Contractor, {
    foreignKey: "company_id",
    as: "contractors",
    onDelete: "CASCADE",
});
db.Contractor.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Address.hasMany(db.Contractor, {
    foreignKey: "address_id",
    as: "contractors",
});
db.Contractor.belongsTo(db.Address, {
    foreignKey: "address_id",
    as: "address",
});

// ChallanSetup relationships
db.Company.hasMany(db.ChallanSetup, {
    foreignKey: "company_id",
    as: "challanSetups",
    onDelete: "CASCADE",
});
db.ChallanSetup.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// ProfessionalTax relationships
db.Company.hasMany(db.ProfessionalTax, {
    foreignKey: "company_id",
    as: "professionalTaxes",
    onDelete: "CASCADE",
});
db.ProfessionalTax.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// BidiRollerWage relationships
db.Company.hasMany(db.BidiRollerWage, {
    foreignKey: "company_id",
    as: "bidiRollerWages",
    onDelete: "CASCADE",
});
db.BidiRollerWage.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// PackingWage relationships
db.Company.hasMany(db.PackingWage, {
    foreignKey: "company_id",
    as: "packingWages",
    onDelete: "CASCADE",
});
db.PackingWage.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// OfficeStaffSalary relationships
db.Company.hasMany(db.OfficeStaffSalary, {
    foreignKey: "company_id",
    as: "officeStaffSalaries",
    onDelete: "CASCADE",
});
db.OfficeStaffSalary.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});
db.Employee.hasMany(db.OfficeStaffSalary, {
    foreignKey: "employee_id",
    as: "officeStaffSalaries",
    onDelete: "CASCADE",
});
db.OfficeStaffSalary.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

// Employee relationships
db.Company.hasMany(db.Employee, {
    foreignKey: "company_id",
    as: "employees",
    onDelete: "CASCADE",
});
db.Employee.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Address.hasMany(db.Employee, {
    foreignKey: "address_id",
    as: "employees",
});
db.Employee.belongsTo(db.Address, {
    foreignKey: "address_id",
    as: "address",
});

db.Contractor.hasMany(db.Employee, {
    foreignKey: "contractor_id",
    as: "employees",
});
db.Employee.belongsTo(db.Contractor, {
    foreignKey: "contractor_id",
    as: "contractor",
});

db.Employee.hasOne(db.EmployeeKycDetail, {
    foreignKey: "employee_id",
    as: "kycDetail",
    onDelete: "CASCADE",
});
db.EmployeeKycDetail.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

db.Employee.hasMany(db.EmployeeNomineeDetail, {
    foreignKey: "employee_id",
    as: "nomineeDetails",
    onDelete: "CASCADE",
});
db.EmployeeNomineeDetail.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

db.Address.hasMany(db.EmployeeNomineeDetail, {
    foreignKey: "address_id",
    as: "nomineeDetails",
});
db.EmployeeNomineeDetail.belongsTo(db.Address, {
    foreignKey: "address_id",
    as: "address",
});

db.Employee.hasMany(db.EmployeeFamilyMember, {
    foreignKey: "employee_id",
    as: "familyMembers",
    onDelete: "CASCADE",
});
db.EmployeeFamilyMember.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

db.Employee.hasMany(db.Attendance, {
    foreignKey: "employee_id",
    as: "attendances",
    onDelete: "CASCADE",
});
db.Attendance.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

// LeaveRequest relationships
db.Company.hasMany(db.LeaveRequest, {
    foreignKey: "company_id",
    as: "leaveRequests",
    onDelete: "CASCADE",
});
db.LeaveRequest.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Employee.hasMany(db.LeaveRequest, {
    foreignKey: "employee_id",
    as: "leaveRequests",
    onDelete: "CASCADE",
});
db.LeaveRequest.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});
// Calender relationships
db.Company.hasMany(db.Calender, {
    foreignKey: "company_id",
    as: "calenders",
    onDelete: "CASCADE",
});
db.Calender.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// OfficeStaffEntry relationships
db.Company.hasMany(db.OfficeStaffEntry, {
    foreignKey: "company_id",
    as: "officeStaffEntries",
    onDelete: "CASCADE",
});
db.OfficeStaffEntry.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Employee.hasMany(db.OfficeStaffEntry, {
    foreignKey: "employee_id",
    as: "officeStaffEntries",
    onDelete: "CASCADE",
});
db.OfficeStaffEntry.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});



// PackersEntry relationships
db.Company.hasMany(db.PackersEntry, {
    foreignKey: "company_id",
    as: "packersEntries",
    onDelete: "CASCADE",
});
db.PackersEntry.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Employee.hasMany(db.PackersEntry, {
    foreignKey: "employee_id",
    as: "packersEntries",
    onDelete: "CASCADE",
});
db.PackersEntry.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

// BidiRollerEntry relationships
db.Company.hasMany(db.BidiRollerEntry, {
    foreignKey: "company_id",
    as: "bidiRollerEntries",
    onDelete: "CASCADE",
});
db.BidiRollerEntry.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Employee.hasMany(db.BidiRollerEntry, {
    foreignKey: "employee_id",
    as: "bidiRollerEntries",
    onDelete: "CASCADE",
});
db.BidiRollerEntry.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

// ChallanDateEntry relationships
db.Company.hasMany(db.ChallanDateEntry, {
    foreignKey: "company_id",
    as: "challanDateEntries",
    onDelete: "CASCADE",
});
db.ChallanDateEntry.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// Resignation relationships
db.Company.hasMany(db.Resignation, {
    foreignKey: "company_id",
    as: "resignations",
    onDelete: "CASCADE",
});
db.Resignation.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// Note relationships
db.Company.hasMany(db.Note, {
    foreignKey: "company_id",
    as: "notes",
    onDelete: "CASCADE",
});
db.Note.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});
// LeaveType <-> Company
db.Company.hasMany(db.LeaveType, {
    foreignKey: "company_id",
    as: "leaveTypes",
    onDelete: "CASCADE",
});
db.LeaveType.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

// Loan relationships
db.Company.hasMany(db.Loan, {
    foreignKey: "company_id",
    as: "loans",
    onDelete: "CASCADE",
});
db.Loan.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Employee.hasMany(db.Loan, {
    foreignKey: "employee_id",
    as: "loans",
    onDelete: "CASCADE",
});
db.Loan.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

db.Loan.hasMany(db.LoanTransaction, {
    foreignKey: "loan_id",
    as: "transactions",
    onDelete: "CASCADE",
});
db.LoanTransaction.belongsTo(db.Loan, {
    foreignKey: "loan_id",
    as: "loan",
});

db.Employee.hasMany(db.LoanTransaction, {
    foreignKey: "employee_id",
    as: "transactions",
    onDelete: "CASCADE",
});
db.LoanTransaction.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

// LeavePolicy relations
db.Company.hasMany(db.LeavePolicy, {
    foreignKey: "company_id",
    as: "leavePolicies",
    onDelete: "CASCADE",
});
db.LeavePolicy.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});
db.LeavePolicy.belongsTo(db.LeaveType, {
    foreignKey: "leave_type_id",
    as: "leaveType",
});
db.LeaveType.hasMany(db.LeavePolicy, {
    foreignKey: "leave_type_id",
    as: "leavePolicies",
    onDelete: "CASCADE",
});

// LeaveBalance relations
db.Company.hasMany(db.LeaveBalance, {
    foreignKey: "company_id",
    as: "leaveBalances",
    onDelete: "CASCADE",
});
db.LeaveBalance.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});
db.LeaveBalance.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});
db.Employee.hasMany(db.LeaveBalance, {
    foreignKey: "employee_id",
    as: "leaveBalances",
    onDelete: "CASCADE",
});
db.LeaveBalance.belongsTo(db.LeaveType, {
    foreignKey: "leave_type_id",
    as: "leaveType",
});
db.LeaveType.hasMany(db.LeaveBalance, {
    foreignKey: "leave_type_id",
    as: "leaveBalances",
    onDelete: "CASCADE",
});

// LeaveTransaction relations
db.Company.hasMany(db.LeaveTransaction, {
    foreignKey: "company_id",
    as: "leaveTransactions",
    onDelete: "CASCADE",
});
db.LeaveTransaction.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});
db.LeaveTransaction.belongsTo(db.Employee, {
    foreignKey: "employee_id",
    as: "employee",
});
db.Employee.hasMany(db.LeaveTransaction, {
    foreignKey: "employee_id",
    as: "leaveTransactions",
    onDelete: "CASCADE",
});
db.LeaveTransaction.belongsTo(db.LeaveType, {
    foreignKey: "leave_type_id",
    as: "leaveType",
});
db.LeaveType.hasMany(db.LeaveTransaction, {
    foreignKey: "leave_type_id",
    as: "leaveTransactions",
    onDelete: "CASCADE",
});

// LeaveRequest <-> LeaveType
db.LeaveRequest.belongsTo(db.LeaveType, {
    foreignKey: "leave_type_id",
    as: "leaveType",
});
db.LeaveType.hasMany(db.LeaveRequest, {
    foreignKey: "leave_type_id",
    as: "leaveRequests",
    onDelete: "CASCADE",
});


// WhatsApp relationships
db.Company.hasOne(db.WhatsAppInstance, {
    foreignKey: "company_id",
    as: "whatsapp_instance",
});
db.WhatsAppInstance.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

db.Company.hasMany(db.WhatsAppTemplate, {
    foreignKey: "company_id",
    as: "whatsapp_templates",
});
db.WhatsAppTemplate.belongsTo(db.Company, {
    foreignKey: "company_id",
    as: "company",
});

module.exports = db;
