const router = require("express").Router();
const foods = require("../controllers/foodController");
const authorize = require("../middlewares/authorize");

router.get("/", foods.listFoods);
router.post("/", foods.createFood);                         // bet kuris prisijunges vartotojas gali prideti maista
router.get("/:foodId", foods.getFood);
router.put("/:foodId", authorize("admin"), foods.updateFood);    // tik admin keicia
router.delete("/:foodId", authorize("admin"), foods.deleteFood); // tik admin trina

module.exports = router;