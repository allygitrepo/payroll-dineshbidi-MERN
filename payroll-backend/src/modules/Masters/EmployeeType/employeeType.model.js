const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const EmployeeType = sequelize.define(
    "EmployeeType",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "employee_types",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["name"]
            }
        ]
    }
);

module.exports = EmployeeType;
