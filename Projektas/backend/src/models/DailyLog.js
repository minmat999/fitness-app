const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// DailyLog - vienos dienos suvestine, priklausanti konkreciai Goal.
const DailyLog = sequelize.define("DailyLog", {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  weightKg: { type: DataTypes.FLOAT, allowNull: true },
  activity: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: true
  },
  note: { type: DataTypes.TEXT, allowNull: true }
});

module.exports = DailyLog;
