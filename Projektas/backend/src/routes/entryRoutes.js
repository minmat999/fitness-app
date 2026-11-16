const router = require("express").Router({ mergeParams: true });
const entries = require("../controllers/entryController");

// Sis routeris yra prijungtas per /api/goals/:goalId/logs/:logId/entries.
// Cia jau turime goalId ir logId, todel kiekvienas valgymas priklauso konkreciai hierarchijai.

// Grazina valgymu sarasa. Jei paduodama ?date=YYYY-MM-DD, filtruoja pagal FoodEntry.eatenAt data.
router.get("/", entries.listEntries);

// Sukuria nauja valgymo irasa: pasirenkamas foodId, mealType, quantityGrams ir eatenAt.
router.post("/", entries.createEntry);

// Grazina viena valgymo irasa pagal entryId.
router.get("/:entryId", entries.getEntry);

// Atnaujina viena valgymo irasa pagal entryId.
router.put("/:entryId", entries.updateEntry);

// Istrina viena valgymo irasa pagal entryId.
router.delete("/:entryId", entries.deleteEntry);

module.exports = router;
