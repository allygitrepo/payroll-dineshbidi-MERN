const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const EmployeeNomineeDetail = sequelize.define(
    "EmployeeNomineeDetail",
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
        address_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        aadhar: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        relation: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        share_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        guardian_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        guardian_address: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "employee_nominee_details",
        timestamps: true,
        underscored: true,
    }
);

module.exports = EmployeeNomineeDetail;
