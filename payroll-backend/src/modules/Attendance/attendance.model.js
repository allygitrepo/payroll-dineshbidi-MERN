const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Attendance = sequelize.define("Attendance", {
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
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    sign_in_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    sign_in_location: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    sign_in_photo: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
    },
    sign_out_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    sign_out_location: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    sign_out_photo: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    is_auto_signout: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    attendance_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Present", // "Present", "Paid Leave", "Unpaid Leave", "Half Day", "Comp Off", "Holiday", "Weekly Off"
    },
    approval_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Approved", // Legacy and Manual records default to Approved
    },
    action_by_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    action_by_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    tableName: "attendance",
    timestamps: true,
    underscored: true,
});

module.exports = Attendance;
