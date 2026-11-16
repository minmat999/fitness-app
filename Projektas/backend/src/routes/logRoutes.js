const router = require("express").Router({ mergeParams: true });
const logs = require("../controllers/logController");
const entryRoutes = require("./entryRoutes");

// Sis routeris yra prijungtas per /api/goals/:goalId/logs.
// mergeParams leidzia cia matyti goalId, kuris ateina is tevinio URL.

// Grazina konkretaus tikslo dienos irasu sarasa.
router.get("/", logs.listLogs);

// Sukuria viena dienos irasa konkretaus tikslo viduje.
router.post("/", logs.createLog);

// Grazina viena dienos irasa pagal logId.
router.get("/:logId", logs.getLog);

// Atnaujina viena dienos irasa pagal logId.
router.put("/:logId", logs.updateLog);

// Istrina viena dienos irasa pagal logId.
router.delete("/:logId", logs.deleteLog);

// Cia URL apima visus 3 objektus: Goal -> DailyLog -> FoodEntry.
// Pvz. /api/goals/1/logs/5/entries perduodama i entryRoutes.js.
router.use("/:logId/entries", entryRoutes);

module.exports = router;
