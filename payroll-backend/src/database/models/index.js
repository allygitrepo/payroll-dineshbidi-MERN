const sequelize = require("../../config/database");
const User = require("../../modules/Users/users.model");
const RefreshToken = require("../../modules/RefreshTokens/refreshTokens.model");
const Company = require("../../modules/Company/company.model");

// Registry object to hold Sequelize, Sequelize constructors, and model definitions
const db = {};

// Attach the configured Sequelize client instance
db.sequelize = sequelize;

// Register models
db.User = User;
db.RefreshToken = RefreshToken;
db.Company = Company;

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

module.exports = db;