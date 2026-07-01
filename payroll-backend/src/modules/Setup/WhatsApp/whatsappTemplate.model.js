const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const WhatsAppTemplate = sequelize.define(
    "WhatsAppTemplate",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "companies", // Must match table name
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    },
    {
        tableName: "whatsapp_templates",
        timestamps: true,
        underscored: true,
    }
);

module.exports = WhatsAppTemplate;
