const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveTransaction = sequelize.define(
    "LeaveTransaction",
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
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        leave_request_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        transaction_type: {
            type: DataTypes.STRING(100),
            allowNull: false, // "Yearly Allocation", "Monthly Accrual", "Leave Approval", "Leave Cancellation", "Carry Forward", "Leave Expiry", "Manual Balance Adjustment"
        },
        leave_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        days: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false, // e.g., +12.00, -2.50
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        changed_by: {
            type: DataTypes.UUID,
            allowNull: true, // Reference to User
        },
    },
    {
        tableName: "leave_transactions",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ["company_id"],
                name: "idx_leave_transaction_company"
            },
            {
                fields: ["employee_id", "leave_type_id"],
                name: "idx_leave_transaction_emp_type"
            }
        ]
    }
);

module.exports = LeaveTransaction;
