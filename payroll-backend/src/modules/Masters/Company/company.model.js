const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

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
            type: DataTypes.STRING(30),
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
        leave_year_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "Calendar Year", // "Calendar Year", "Financial Year", "Joining Anniversary"
        },
        sandwich_policy_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        comp_off_expiry_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 90,
        },
    },
    {
        tableName: "companies",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["establishment_id"]
            }
        ]
    }
);

Company.afterCreate(async (company, options) => {
    try {
        const WhatsAppTemplate = require("../../Setup/WhatsApp/whatsappTemplate.model");
        const templateContent = `Hello {{name}},\nYour login ID and password are as follows for \nCompany name: {{company_name}}\nUrl: payroll.allysoftsolutions.com\nUsername: {{username}}\nPassword: {{password}}`;
        
        await WhatsAppTemplate.create({
            company_id: company.id,
            name: 'Contractor Login Credentials',
            content: templateContent,
            status: true
        }, { transaction: options.transaction });
        console.log(`Default WhatsApp template automatically created for company ${company.company_name}`);
    } catch (err) {
        console.error("Failed to auto-create default WhatsApp template for company:", err);
    }
});

module.exports = Company;
