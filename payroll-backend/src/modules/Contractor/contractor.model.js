const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Contractor = sequelize.define(
    "Contractor",
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
        address_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        ccode: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        pf_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        date_of_joining: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        pan: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        aadhar: {
            type: DataTypes.STRING(12),
            allowNull: true,
        },
        gst_no: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        bank_ac: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        ifsc: {
            type: DataTypes.STRING(11),
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "contractors",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Contractor;
