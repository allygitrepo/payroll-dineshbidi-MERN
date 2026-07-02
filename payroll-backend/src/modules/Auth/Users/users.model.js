const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "Roles",
                key: "id",
            },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        contractor_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "contractors",
                key: "id",
            },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        tableName: "Users",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["user_id"]
            }
        ]
    }
);

module.exports = User;
