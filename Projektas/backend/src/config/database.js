const { Sequelize } = require("sequelize");
require("dotenv").config();

// Viena vieta, kur backend jungiasi prie MySQL.
const sequelize = new Sequelize(
  process.env.DB_NAME || "fitness_tracker_l1",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    // Azure MySQL reikalauja sifruoto (SSL/TLS) prisijungimo. Lokaliai (XAMPP) DB_SSL nenustatomas.
    dialectOptions: process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}
  }
);

module.exports = sequelize;