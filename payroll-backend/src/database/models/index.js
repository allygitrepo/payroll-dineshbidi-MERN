const sequelize = require("../../config/database");
const User = require("../../modules/Users/users.model");
const RefreshToken = require("../../modules/RefreshTokens/refreshTokens.model");
const Company = require("../../modules/Company/company.model");
const Address = require("../../modules/Address/address.model");
const Contractor = require("../../modules/Contractor/contractor.model");

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

module.exports = db;