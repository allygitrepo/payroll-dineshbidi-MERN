const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ProfessionalTax = sequelize.define(
    "ProfessionalTax",
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
        from_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        to_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        tax_rate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "professional_taxes",
        timestamps: true,
        underscored: true,
    }
);

module.exports = ProfessionalTax;
