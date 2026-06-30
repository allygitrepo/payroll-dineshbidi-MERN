const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Employee = sequelize.define(
    "Employee",
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
        contractor_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        address_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        image_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        uan: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        ip_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        member_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        aadhar: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        gender: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        father_or_husband_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        relation: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        marital_status: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        mobile: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        qualification: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        date_of_joining: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        employee_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        employee_type_id: {
            type: DataTypes.UUID,
            allowNull: true, // Nullable initially to allow backward-compatible sync
        },
        nationality: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: "INDIAN",
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        is_international_worker: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        physical_handicap: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        pmrpy: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        abry_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        face_descriptor_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        tableName: "employees",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Employee;
