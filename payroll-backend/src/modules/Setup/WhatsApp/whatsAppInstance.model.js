const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const WhatsAppInstance = sequelize.define(
    "WhatsAppInstance",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // Only one instance per company
            references: {
                model: "companies", // Must match table name
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        instance_key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "initiated",
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profile_image: {
            type: DataTypes.TEXT("long"), // Store base64 image
            allowNull: true,
        },
        valid_in_seconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 40,
        }
    },
    {
        tableName: "whatsapp_instances",
        timestamps: true,
        underscored: true,
    }
);

module.exports = WhatsAppInstance;
