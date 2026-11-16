const router = require("express").Router();
const goals = require("../controllers/goalController");
const reports = require("../controllers/reportController");
const logRoutes = require("./logRoutes");

// Visi keliai siame faile prasideda nuo /api/goals, nes app.js taip prijungia goalRoutes.
// Pvz. router.get("/") reiskia GET /api/goals.

// Grazina visu tikslu sarasa. Galima naudoti filtrus, pvz. ?type=weight_loss.
router.get("/", goals.listGoals);

// Sukuria nauja tiksla. Body turi ateiti JSON formatu.
router.post("/", goals.createGoal);

// Grazina viena konkretu tiksla pagal ID is URL, pvz. /api/goals/1.
router.get("/:goalId", goals.getGoal);

// Pakeicia konkretaus tikslo duomenis pagal ID.
router.put("/:goalId", goals.updateGoal);

// Istrina konkretu tiksla pagal ID.
router.delete("/:goalId", goals.deleteGoal);

// Papildomas endpointas: suvestine is keliu lenteliu, ne vien CRUD.
router.get("/:goalId/dashboard", goals.getDashboard);

// Ataskaitos pagal pasirinkta laikotarpi: diena, savaite arba menuo.
router.get("/:goalId/reports", reports.getReports);

// DI izvalgos pagal ta pati laikotarpi, kuris naudojamas ataskaitai.
router.post("/:goalId/insights", reports.getInsights);

// Cia prasideda hierarchinis URL: /goals/:goalId/logs/...
// Viskas, kas prasideda /api/goals/:goalId/logs, perduodama i logRoutes.js.
router.use("/:goalId/logs", logRoutes);

module.exports = router;
