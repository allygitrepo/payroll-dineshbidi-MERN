const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const LoanTransaction = sequelize.define(
    "LoanTransaction",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        loan_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "loans",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "employees",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        transaction_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("Auto_Deduction", "Manual_Payment"),
            allowNull: false,
        },
        payment_source: {
            type: DataTypes.ENUM("Salary", "Cash", "Bank"),
            defaultValue: "Salary",
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "loan_transactions",
        timestamps: true,
        underscored: true,
    }
);

module.exports = LoanTransaction;
