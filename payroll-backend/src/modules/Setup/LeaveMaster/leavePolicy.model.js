const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeavePolicy = sequelize.define(
    "LeavePolicy",
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
        employee_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        yearly_allocation: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
        monthly_accrual_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        monthly_accrual_amount: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
        carry_forward_allowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        max_carry_forward: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
    },
    {
        tableName: "leave_policies",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["company_id", "employee_type_id", "leave_type_id"],
                name: "uq_leave_policy_company_emp_type_leave_type",
            },
        ],
    }
);

module.exports = LeavePolicy;
