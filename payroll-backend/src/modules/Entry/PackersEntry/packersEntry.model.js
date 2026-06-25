const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const PackersEntry = sequelize.define(
    "PackersEntry",
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
        no_of_days_worked: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: false,
            defaultValue: 0,
        },
        unit_1: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        unit_2: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        unit_3: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        unit_4: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        wages: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        weekly_leave: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        addition_if_any: {
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
        tableName: "packers_entry",
        timestamps: true,
        underscored: true,
    }
);

module.exports = PackersEntry;
