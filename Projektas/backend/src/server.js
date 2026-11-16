// Serveris visada dirba UTC laiku. Tada valgymo laikas (pvz. "18:30") MySQL'e issaugomas
// lygiai toks, koks ivestas, ir grazinamas toks pat (be laiko zonos poslinkio -2/-3 val.).
process.env.TZ = "UTC";
require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const port = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Prisijungta prie MySQL");
    app.listen(port, () => console.log(`Backend veikia: http://localhost:${port}`));
  } catch (err) {
    console.error("Nepavyko paleisti backend. Patikrinkite .env ir MySQL.", err.message);
    process.exit(1);
  }
}

start();
