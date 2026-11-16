const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Goal - auksciausias hierarchijos objektas: naudotojo sveikatos tikslas.
const Goal = sequelize.define("Goal", {
  // title yra vartotojui matomas pasirinkimas frontend'e.
  title: {
    type: DataTypes.ENUM("Auginti raumenis", "Mazinti svori", "Islaikyti svori"),
    allowNull: false
  },
  // type yra technine reiksme API filtravimui, pvz. /api/goals?type=weight_loss.
  type: {
    type: DataTypes.ENUM("weight_loss", "maintain", "muscle_gain"),
    allowNull: false
  },
  // Sie laukai reikalingi automatiniam kaloriju ir baltymu normos skaiciavimui.
  startWeightKg: { type: DataTypes.FLOAT, allowNull: false },
  targetWeightKg: { type: DataTypes.FLOAT, allowNull: false },
  heightCm: { type: DataTypes.INTEGER, allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },

  // Sitie tikslai nera rasomi ranka - juos uzpildo goalTargetService.
  dailyCaloriesTarget: { type: DataTypes.INTEGER, allowNull: false },
  dailyProteinTarget: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 }
});

module.exports = Goal;
