const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const EmployeeFamilyMember = sequelize.define(
    "EmployeeFamilyMember",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        relation: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        aadhar: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "employee_family_members",
        timestamps: true,
        underscored: true,
    }
);

module.exports = EmployeeFamilyMember;
