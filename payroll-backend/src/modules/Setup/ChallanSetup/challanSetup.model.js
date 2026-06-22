const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ChallanSetup = sequelize.define(
    "ChallanSetup",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        salary_limit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 15000.00,
        },
        edli_wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 15000.00,
        },
        ac1_ee_male: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 10.00,
        },
        ac1_ee_female: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 10.00,
        },
        ac1_er: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 1.67,
        },
        ac2: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.50,
        },
        ac10: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 8.33,
        },
        ac21: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.50,
        },
        ac22: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        ac2_min: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 500.00,
        },
        ac22_min: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        pmrpy: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 8.33,
        },
        esic_wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 176.00,
        },
        employee_share: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.75,
        },
        employer_share: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 3.25,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "challan_setups",
        timestamps: true,
        underscored: true,
    }
);

module.exports = ChallanSetup;
