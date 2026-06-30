const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveType = sequelize.define(
    "LeaveType",
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        half_day_allowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        requires_supporting_document: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        requires_approval: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "leave_types",
        timestamps: true,
        underscored: true,
    }
);

module.exports = LeaveType;
