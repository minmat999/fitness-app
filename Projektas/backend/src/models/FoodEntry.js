const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// FoodEntry - konkretus maisto irasas konkreciai dienai.
const FoodEntry = sequelize.define("FoodEntry", {
  // Valgymo tipas. Pusryciai/pietus/vakariene ribojami iki vieno karto per diena, uzkandziu gali buti daug.
  mealType: {
    type: DataTypes.ENUM("breakfast", "lunch", "dinner", "snack"),
    allowNull: false
  },
  // Kiek gramu pasirinkto Food produkto buvo suvalgyta.
  quantityGrams: { type: DataTypes.FLOAT, allowNull: false },

  // Tikras valgymo laikas. Sarasai, ataskaitos ir DI izvalgos remiasi sio stulpelio data.
  eatenAt: { type: DataTypes.DATE, allowNull: true }
});

module.exports = FoodEntry;
