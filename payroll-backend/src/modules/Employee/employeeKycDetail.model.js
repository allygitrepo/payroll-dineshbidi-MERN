const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const EmployeeKycDetail = sequelize.define(
    "EmployeeKycDetail",
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
        pan: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        bank_ac: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ifsc: {
            type: DataTypes.STRING(11),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "employee_kyc_details",
        timestamps: true,
        underscored: true,
    }
);

module.exports = EmployeeKycDetail;
