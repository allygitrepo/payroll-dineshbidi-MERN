const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Role = sequelize.define(
    "Role",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        permissions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "Roles",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Role;
