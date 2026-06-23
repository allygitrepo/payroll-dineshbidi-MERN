const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const Resignation = sequelize.define(
    "Resignation",
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
        account_no: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        date_of_leaving: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        reason_of_leaving: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    },
    {
        tableName: "resignations",
        timestamps: true,
        underscored: true,
    }
);

module.exports = Resignation;
