const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Food - maisto katalogas. Naudotojas pirma sukuria maista, tada ji renkasi valgymo irase.
const Food = sequelize.define("Food", {
  name: { type: DataTypes.STRING, allowNull: false },
  caloriesPer100g: { type: DataTypes.FLOAT, allowNull: false },
  proteinPer100g: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  carbsPer100g: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  fatPer100g: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
}, {
  tableName: "Foods"
});

module.exports = Food;
