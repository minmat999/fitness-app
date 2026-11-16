const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const goalRoutes = require("./routes/goalRoutes");
const foodRoutes = require("./routes/foodRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const authenticate = require("./middlewares/authenticate");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
// Azure (ir kiti serveriai) priima HTTPS ir perduoda uzklausa i Node per proxy.
// trust proxy - kad req.protocol butu "https" (svarbu hypermedia nuorodoms).
app.set("trust proxy", 1);
const openApiDocument = YAML.load(path.join(__dirname, "../docs/api-spec.yaml"));

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "OK", service: "fitness-tracker-backend" }));
app.use("/api/auth", authRoutes);
app.use("/api/foods", authenticate, foodRoutes);
app.use("/api/goals", authenticate, goalRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Publikuotoje versijoje tas pats serveris atiduoda ir sukompiliuota React frontend'a (backend/public).
// Frontend sukompiliuojamas komanda "npm run build" frontend aplanke (zr. frontend/vite.config.js).
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
// Visi ne /api GET keliai grazina index.html (React programa). Jei public aplanko nera (lokaliai) - einama toliau i 404.
app.get(/^\/(?!api).*/, (req, res, next) => {
  res.sendFile(path.join(publicDir, "index.html"), (err) => { if (err) next(); });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
