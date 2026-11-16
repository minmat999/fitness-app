// Ikelia .sql faila (pvz. phpMyAdmin eksporta) i duomenu baze, nurodyta DB_* kintamuosiuose.
// Naudojama perkelti lokalia DB i Azure MySQL (zr. DEPLOY.md).
// Paleidimas backend aplanke:  node scripts/importSql.js C:\kelias\iki\failo.sql
require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");

async function run() {
  const file = process.argv[2];
  if (!file) throw new Error("Nurodykite .sql failo kelia, pvz.: node scripts/importSql.js C:\\Users\\...\\fitness_tracker_l1.sql");

  // Naujesnis MariaDB eksportas pirmoje eilutėje turi "sandbox" komanda, kurios MySQL nesupranta - ja pasaliname.
  const sql = fs.readFileSync(file, "utf8").replace(/^\/\*M!999999.*\r?\n/, "");

  console.log(`Jungiamasi prie ${process.env.DB_HOST} / ${process.env.DB_NAME} ...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, // leidzia ivykdyti visa faila vienu kartu
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
  });

  // Azure MySQL lentelems be pirminio rakto automatiskai prideda paslepta rakta (sql_generate_invisible_primary_key).
  // phpMyAdmin eksportas raktus prideda tik failo gale, todel butu klaida "Multiple primary key defined".
  try {
    await connection.query("SET SESSION sql_generate_invisible_primary_key = OFF");
  } catch {
    console.log("Pastaba: nepavyko isjungti sql_generate_invisible_primary_key - isjunk ji Azure portale (Server parameters).");
  }

  console.log("Vykdomas importas...");
  await connection.query(sql);

  // Patikrinimui parodome, kiek irasu yra kiekvienoje lenteleje.
  const [tables] = await connection.query("SHOW TABLES");
  for (const row of tables) {
    const table = Object.values(row)[0];
    const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    console.log(`  ${table}: ${count} irasu`);
  }

  await connection.end();
  console.log("Importas baigtas.");
}

run().catch((err) => {
  console.error("Klaida:", err.message);
  process.exit(1);
});
