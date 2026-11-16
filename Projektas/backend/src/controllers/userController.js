const bcrypt = require("bcryptjs");
const { User, Goal } = require("../models");
const { httpError, pageOptions, pagination, requireFields } = require("../utils");

// Tik admin kviecia visas sias funkcijas (tikrinama routes/userRoutes.js).

async function listUsers(req, res, next) {
  try {
    const { page, limit, offset } = pageOptions(req.query);
    const result = await User.findAndCountAll({
      attributes: ["id", "email", "role", "createdAt"],
      limit, offset, order: [["id", "ASC"]]
    });
    res.json({ data: result.rows, pagination: pagination(result.count, page, limit) });
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const user = await findUser(req.params.userId);
    // Admin gali matyti ir to naudotojo tiksla (kelios esybes viename atsakyme).
    const goal = await Goal.findOne({ where: { userId: user.id } });
    res.json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt, goal });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const user = await findUser(req.params.userId);
    const updates = {};
    if (req.body.role) {
      if (!["user", "admin"].includes(req.body.role)) throw httpError(422, "Netinkama role");
      updates.role = req.body.role;
    }
    if (req.body.email) updates.email = req.body.email;
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    await user.update(updates);
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err.name === "SequelizeValidationError" ? httpError(422, err.message) : err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await findUser(req.params.userId);
    // Apsauga: administratorius negali istrinti saves (issivengti uzsirakinimo be jokio admin).
    if (Number(req.params.userId) === Number(req.user.id)) {
      throw httpError(409, "Negalite istrinti savo paskyros");
    }
    await user.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
}

async function findUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw httpError(404, "Naudotojas nerastas");
  return user;
}

module.exports = { listUsers, getUser, updateUser, deleteUser };