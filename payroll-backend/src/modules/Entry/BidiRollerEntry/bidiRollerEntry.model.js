const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const BidiRollerEntry = sequelize.define(
    "BidiRollerEntry",
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
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        month_year: {
            type: DataTypes.STRING(7), // Format YYYY-MM
            allowNull: false,
        },
        unit_1_days: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        unit_2_days: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        no_of_days_worked: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: false,
            defaultValue: 0,
        },
        leave_with_pay: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: false,
            defaultValue: 0,
        },
        wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        bonus: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        gross_wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        epf_wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        epf_contri_remitted: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        pt_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        esic_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        net_wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "bidi_roller_entry",
        timestamps: true,
        underscored: true,
    }
);

module.exports = BidiRollerEntry;
