const { DataTypes } = require("sequelize");
// Custom database configuration - replace with your Sequelize instance path
// e.g. const sequelize = new Sequelize(dbConfig);
const { sequelize } = require("../config_placeholder"); 

// Mock Employee model reference - replace with your project's Employee / User model import
const Employee = require("./employee_placeholder");

const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Employee,
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  date: {
    type: DataTypes.DATEONLY, // Format: YYYY-MM-DD
    allowNull: false,
  },
  sign_in_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sign_in_photo: {
    type: DataTypes.TEXT('long'), // Stores base64 encoded photo frame
    allowNull: true,
  },
  sign_out_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sign_out_location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sign_out_photo: {
    type: DataTypes.TEXT('long'), // Stores base64 encoded photo frame
    allowNull: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // true represents present, false represents absent/on-leave
  },
  is_auto_signout: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // flag set to true if checked out by backend schedule
  }
}, {
  tableName: "attendance",
  timestamps: true,
});

// Setup Associations
Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
  as: "attendances",
});
Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

module.exports = Attendance;
