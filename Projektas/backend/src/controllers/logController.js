const { DailyLog, Food, FoodEntry } = require("../models");
const { findGoal } = require("./goalController");
const { httpError, pageOptions, pagination, links, requireFields, pick } = require("../utils");

// Leistini dienos iraso laukai. goalId cia NERA - jis visada imamas is URL.
const LOG_FIELDS = ["date", "weightKg", "activity", "note"];

async function listLogs(req, res, next) {
  try {
    // Pirmiausia patikriname, ar tikslas egzistuoja ir priklauso siam vartotojui. Jei ne - findGoal grazins 404/403.
    const goal = await findGoal(req, req.params.goalId);
    const { page, limit, offset } = pageOptions(req.query);

    // Dienos irasus visada ribojame pagal konkretu goalId, kad nemaisytume skirtingu tikslu.
    const where = { goalId: goal.id };
    if (req.query.date) where.date = req.query.date;
    if (req.query.activity) where.activity = req.query.activity;

    // Sarasas rusiuojamas nuo naujausios dienos.
    const result = await DailyLog.findAndCountAll({ where, limit, offset, order: [["date", "DESC"]] });
    res.json({
      data: result.rows.map((log) => ({ ...log.toJSON(), _links: logLinks(req, goal.id, log.id) })),
      pagination: pagination(result.count, page, limit),
      _links: links(req)
    });
  } catch (err) {
    next(err);
  }
}

async function getLog(req, res, next) {
  try {
    // findLog patikrina ir goalId, ir logId, todel negalima paimti svetimo dienos iraso.
    const log = await findLog(req, req.params.goalId, req.params.logId);
    res.json({ ...log.toJSON(), _links: logLinks(req, req.params.goalId, log.id) });
  } catch (err) {
    next(err);
  }
}

async function createLog(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);

    // Dienos irasui privaloma data, nes pagal ja veliau grupuojami komentarai/svoris/aktyvumas.
    requireFields(req.body, ["date"]);
    validateActivity(req.body.activity);

    // Vienam tikslui viena diena gali tureti tik viena DailyLog.
    const existingLog = await DailyLog.findOne({ where: { goalId: goal.id, date: req.body.date } });
    if (existingLog) throw httpError(409, "Siai dienai dienos irasas jau sukurtas.");

    const log = await DailyLog.create({ ...pick(req.body, LOG_FIELDS), goalId: goal.id });
    res.status(201).json({ ...log.toJSON(), _links: logLinks(req, goal.id, log.id) });
  } catch (err) {
    next(err);
  }
}

async function updateLog(req, res, next) {
  try {
    const log = await findLog(req, req.params.goalId, req.params.logId);
    validateActivity(req.body.activity);

    // Jei vartotojas keicia data, patikriname, ar ta diena jau neturi kito iraso.
    if (req.body.date && req.body.date !== log.date) {
      const existingLog = await DailyLog.findOne({ where: { goalId: req.params.goalId, date: req.body.date } });
      if (existingLog) throw httpError(409, "Siai dienai dienos irasas jau sukurtas.");
    }
    // Jei body bus "goalId", jis bus ignoruojamas - irasas liks savo tiksle.
    await log.update(pick(req.body, LOG_FIELDS));
    res.json({ ...log.toJSON(), _links: logLinks(req, req.params.goalId, log.id) });
  } catch (err) {
    next(err);
  }
}

function validateActivity(activity) {
  // Leidziamos tik trys aktyvumo reiksmes, kurios naudojamos frontend dropdown'e.
  const allowed = [undefined, "", "low", "medium", "high"];
  if (!allowed.includes(activity)) throw httpError(422, "Aktyvumas turi buti low, medium arba high");
}

async function deleteLog(req, res, next) {
  try {
    const log = await findLog(req, req.params.goalId, req.params.logId);
    await log.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function findLog(req, goalId, logId) {
  // Sitas metodas yra bendras: ji naudoja ir DailyLog endpointai, ir FoodEntry endpointai.
  await findGoal(req, goalId);
  const log = await DailyLog.findOne({ where: { id: logId, goalId }, include: { model: FoodEntry, include: Food } });
  if (!log) throw httpError(404, "Dienos irasas nerastas tame tiksle");
  return log;
}

function logLinks(req, goalId, logId) {
  const base = `${req.protocol}://${req.get("host")}/api/goals/${goalId}/logs/${logId}`;
  return {
    self: base,
    goal: `${req.protocol}://${req.get("host")}/api/goals/${goalId}`,
    entries: `${base}/entries`
  };
}

module.exports = { listLogs, getLog, createLog, updateLog, deleteLog, findLog };