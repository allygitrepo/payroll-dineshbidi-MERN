const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Calender = sequelize.define(
    "Calender",
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
        holiday_type: {
            type: DataTypes.ENUM("COMPANY", "WEEKLY"),
            allowNull: false,
        },
        week_day: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        holiday_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "calenders",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Calender;
