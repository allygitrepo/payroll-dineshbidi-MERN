const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveRequest = sequelize.define("LeaveRequest", {
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
    leave_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    total_leaves: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    remaining_leaves: {
        type: DataTypes.DECIMAL(4, 1),
        defaultValue: 0.0,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: "Pending",
    },
    request_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    from_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    to_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    tableName: "leave_requests",
    timestamps: true,
    underscored: true,
});

module.exports = LeaveRequest;
