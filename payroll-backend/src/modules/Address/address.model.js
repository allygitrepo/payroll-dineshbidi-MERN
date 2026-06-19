const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Address = sequelize.define(
    "Address",
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
        address: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        post_office: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        district: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        pincode: {
            type: DataTypes.STRING(6),
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "addresses",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Address;
