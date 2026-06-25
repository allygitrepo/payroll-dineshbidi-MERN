const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const PackingWage = sequelize.define(
    "PackingWage",
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
        rate_1: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        rate_2: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        rate_3: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        rate_4: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        },
        bonus: {
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
        tableName: "packing_wages",
        timestamps: true,
        underscored: true,
    }
);

module.exports = PackingWage;
