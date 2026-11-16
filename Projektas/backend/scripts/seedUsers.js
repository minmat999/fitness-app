require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User, Goal } = require("../src/models");

async function run() {
  await sequelize.authenticate();

  const users = [
    { email: "admin@example.com", password: "Admin123!", role: "admin" },
    { email: "vartotojas1@example.com", password: "Vartotojas123!", role: "user" },
    { email: "vartotojas2@example.com", password: "Vartotojas123!", role: "user" },
    { email: "vartotojas3@example.com", password: "Vartotojas123!", role: "user" },
    { email: "vartotojas4@example.com", password: "Vartotojas123!", role: "user" },
    { email: "vartotojas5@example.com", password: "Vartotojas123!", role: "user" }
  ];

  const created = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await User.create({ email: u.email, passwordHash, role: u.role });
    created[u.email] = user;
    console.log(`Sukurtas: ${u.email} / ${u.password} / role=${u.role}`);
  }

  // Esamus 5 goals irasus priskiriame 5 skirtingiems naudotojams (goalId: 7,8,10,11,12).
  const assignments = [
    { goalId: 7, email: "vartotojas1@example.com" },
    { goalId: 8, email: "vartotojas2@example.com" },
    { goalId: 10, email: "vartotojas3@example.com" },
    { goalId: 11, email: "vartotojas4@example.com" },
    { goalId: 12, email: "vartotojas5@example.com" }
  ];

  for (const a of assignments) {
    const goal = await Goal.findByPk(a.goalId);
    if (goal) {
      goal.userId = created[a.email].id;
      await goal.save();
      console.log(`Goal #${a.goalId} priskirtas ${a.email}`);
    } else {
      console.log(`Goal #${a.goalId} nerastas - praleidziama`);
    }
  }

  console.log("\nBaigta. Dabar paleisk apatine SQL migracijos dali (sugriezinti userId stulpeli).");
  process.exit(0);
}

run().catch((err) => {
  console.error("Klaida:", err.message);
  process.exit(1);
});