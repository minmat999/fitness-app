const sequelize = require("../config/database");
const Goal = require("./Goal");
const DailyLog = require("./DailyLog");
const Food = require("./Food");
const FoodEntry = require("./FoodEntry");
const User = require("./User");
const RefreshToken = require("./RefreshToken");

User.hasOne(Goal, { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
Goal.belongsTo(User, { foreignKey: "userId" });

User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

// Hierarchija: Goal -> DailyLog -> FoodEntry.
Goal.hasMany(DailyLog, { foreignKey: "goalId", onDelete: "CASCADE" });
DailyLog.belongsTo(Goal, { foreignKey: "goalId" });

DailyLog.hasMany(FoodEntry, { foreignKey: "dailyLogId", onDelete: "CASCADE" });
FoodEntry.belongsTo(DailyLog, { foreignKey: "dailyLogId" });

Food.hasMany(FoodEntry, { foreignKey: "foodId", onDelete: "RESTRICT" });
FoodEntry.belongsTo(Food, { foreignKey: "foodId" });

module.exports = { sequelize, Goal, DailyLog, Food, FoodEntry, User, RefreshToken };
