const sequelize = require("../../config/database");
const User = require("../../modules/Auth/Users/users.model");
const RefreshToken = require("../../modules/Auth/RefreshTokens/refreshTokens.model");
const Company = require("../../modules/Masters/Company/company.model");
const Address = require("../../modules/Masters/Address/address.model");
const Contractor = require("../../modules/Masters/Contractor/contractor.model");
const Employee = require("../../modules/Masters/Employee/employee.model");
const EmployeeKycDetail = require("../../modules/Masters/Employee/employeeKycDetail.model");
const EmployeeNomineeDetail = require("../../modules/Masters/Employee/employeeNomineeDetail.model");
const EmployeeFamilyMember = require("../../modules/Masters/Employee/employeeFamilyMember.model");
const ChallanSetup = require("../../modules/Setup/ChallanSetup/challanSetup.model");
const ProfessionalTax = require("../../modules/Setup/ProfessionalTax/professionalTax.model");
const BidiRollerWage = require("../../modules/Setup/BidiRollerWage/bidiRollerWage.model");
const PackingWage = require("../../modules/Setup/PackingWage/packingWage.model");
const OfficeStaffSalary = require("../../modules/Setup/OfficeStaffSalary/officeStaffSalary.model");

// Registry object to hold Sequelize, Sequelize constructors, and model definitions
const db = {};

// Attach the configured Sequelize client instance
db.sequelize = sequelize;

// Register models
db.User = User;
db.RefreshToken = RefreshToken;
db.Company = Company;
db.Address = Address;
db.Contractor = Contractor;
db.Employee = Employee;
db.EmployeeKycDetail = EmployeeKycDetail;
db.EmployeeNomineeDetail = EmployeeNomineeDetail;
db.EmployeeFamilyMember = EmployeeFamilyMember;
db.ChallanSetup = ChallanSetup;
db.ProfessionalTax = ProfessionalTax;
db.BidiRollerWage = BidiRollerWage;
db.PackingWage = PackingWage;
db.OfficeStaffSalary = OfficeStaffSalary;

// Model associations
db.User.hasMany(db.RefreshToken, {
    foreignKey: "user_id",
    as: "refreshTokens",
    onDelete: "CASCADE",
});
db.RefreshToken.belongsTo(db.User, {
    foreignKey: "user_id",
    as: "user",
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

module.exports = db;