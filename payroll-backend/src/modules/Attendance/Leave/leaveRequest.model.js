const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveRequest = sequelize.define(
    "LeaveRequest",
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
                model: "employees",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "companies",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        leave_type_id: {
            type: DataTypes.UUID,
            allowNull: true, // Nullable to prevent crash on existing records when sync alter runs
        },
        leave_type: {
            type: DataTypes.STRING(255),
            allowNull: true, // Make nullable for legacy records
        },
        total_leaves: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true,
        },
        remaining_leaves: {
            type: DataTypes.DECIMAL(4, 1),
            defaultValue: 0.0,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true, // Legacy description
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true, // New description/reason field
        },
        number_of_days: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false,
            defaultValue: 1.0,
        },
        day_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "Full Day", // "Full Day", "First Half", "Second Half"
        },
        attachment_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: "Draft", // "Draft", "Submitted", "Approved", "Rejected", "Cancelled"
        },
        request_date: {
            type: DataTypes.DATEONLY,
            allowNull: true, // Legacy field
        },
        applied_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        from_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        to_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        tableName: "leave_requests",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ["company_id", "status"],
                name: "idx_leave_request_company_status"
            },
            {
                fields: ["employee_id", "status"],
                name: "idx_leave_request_emp_status"
            }
        ]
    }
);

module.exports = LeaveRequest;
