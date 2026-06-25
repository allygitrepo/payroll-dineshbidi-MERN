const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ChallanDateEntry = sequelize.define(
    "ChallanDateEntry",
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
        wage_month: {
            type: DataTypes.STRING(7), // Format MM/YYYY
            allowNull: false,
        },
        ttrn: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        crn_no: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        challan_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        ac1ee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ac1er: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ac2: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ac10: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ac21: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        ac22: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        return_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    },
    {
        tableName: "challan_date_entry",
        timestamps: false,
        underscored: true,
    }
);

module.exports = ChallanDateEntry;
