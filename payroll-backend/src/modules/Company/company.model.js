const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const Company = sequelize.define(
    "Company",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        establishment_id: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true,
        },
        company_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        company_type: {
            type: DataTypes.ENUM("Proprietorship", "Partnership", "Private Limited", "Public"),
            allowNull: false,
            defaultValue: "Proprietorship",
        },
        epfo_office: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        lin_number: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        esic_id: {
            type: DataTypes.STRING(17),
            allowNull: true,
        },
        address_line: {
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
        pan: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        tan: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        professional_tax_reg_no: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        email_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cstatus: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "companies",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Company;
