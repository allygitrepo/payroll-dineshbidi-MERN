const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Loan = sequelize.define(
    "Loan",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Employees",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Companies",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        remaining_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        emi_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        emi_type: {
            type: DataTypes.ENUM("Fixed", "Flexible"),
            defaultValue: "Fixed",
            allowNull: false,
        },
        tenure_months: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        interest_rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00,
            allowNull: false,
        },
        interest_type: {
            type: DataTypes.ENUM("Flat", "Reducing"),
            defaultValue: "Flat",
            allowNull: false,
        },
        deduction_type: {
            type: DataTypes.ENUM("Daily", "Monthly"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("Active", "Paused", "Completed", "Manual_Closed"),
            defaultValue: "Active",
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        last_deduction_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
    },
    {
        tableName: "loans",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Loan;
