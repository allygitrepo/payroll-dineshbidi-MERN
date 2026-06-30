const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveBalance = sequelize.define(
    "LeaveBalance",
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
        leave_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        allocated: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
        used: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
        carry_forward: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
    },
    {
        tableName: "leave_balances",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["company_id", "employee_id", "leave_type_id", "leave_year"],
                name: "uq_leave_balance_comp_emp_leave_year",
            },
        ],
    }
);

module.exports = LeaveBalance;
