const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const LeaveMaster = sequelize.define(
    "LeaveMaster",
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
        leave_type: {
            type: DataTypes.STRING(255),
            allowNull: true, // Nullable to act as a placeholder for yearly_leave_cap when no leave types are created yet
        },
        leave_days: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: true, // Optional field
        },
        yearly_leave_cap: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: true,
            defaultValue: 12.0,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "leave_masters",
        timestamps: true,
        underscored: true,
    }
);

module.exports = LeaveMaster;
