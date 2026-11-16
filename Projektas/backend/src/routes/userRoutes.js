const router = require("express").Router();
const users = require("../controllers/userController");
const authorize = require("../middlewares/authorize");

router.get("/", authorize("admin"), users.listUsers);
router.get("/:userId", authorize("admin"), users.getUser);
router.put("/:userId", authorize("admin"), users.updateUser);
router.delete("/:userId", authorize("admin"), users.deleteUser);

module.exports = router;