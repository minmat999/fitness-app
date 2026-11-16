const { Op } = require("sequelize");
const { Goal, DailyLog, Food, FoodEntry } = require("../models");
const { httpError, pageOptions, pagination, links, requireFields, ensureGoalAccess, pick } = require("../utils");

// Laukai, kuriuos naudotojas gali pats nustatyti. userId, id ir kaloriju tikslu cia NERA.
const GOAL_FIELDS = ["title", "type", "startWeightKg", "targetWeightKg", "heightCm", "age"];
const { formatEntry } = require("../services/nutritionService");
const { calculateGoalTargets } = require("../services/goalTargetService");

async function listGoals(req, res, next) {
  try {
    // Is query parametru paimame puslapiavima: ?page=1&limit=10.
    const { page, limit, offset } = pageOptions(req.query);

    // where objektas yra Sequelize filtras, kuris veliau pavirsta SQL WHERE dalimi.
    const where = {};
    if (req.user.role !== "admin") where.userId = req.user.id;
    if (req.query.type) where.type = req.query.type;
    if (req.query.search) where.title = { [Op.like]: `%${req.query.search}%` };

    // findAndCountAll grazina ir eilutes, ir bendra kieki puslapiavimui.
    const result = await Goal.findAndCountAll({ where, limit, offset, order: [["id", "ASC"]] });
    res.json({
      data: result.rows.map((goal) => ({ ...goal.toJSON(), _links: goalLinks(req, goal.id) })),
      pagination: pagination(result.count, page, limit),
      _links: links(req)
    });
  } catch (err) {
    next(err);
  }
}

async function getGoal(req, res, next) {
  try {
    // goalId ateina is URL, pvz. GET /api/goals/1 -> req.params.goalId yra "1".
    const goal = await findGoal(req, req.params.goalId);
    res.json({ ...goal.toJSON(), _links: goalLinks(req, goal.id) });
  } catch (err) {
    next(err);
  }
}

async function createGoal(req, res, next) {
  try {
    // Pagal dabartine uzduoties logika vienam naudotojui leidziamas tik vienas tikslas.
    const existingGoal = await Goal.findOne({ where: { userId: req.user.id } });
    if (existingGoal) throw httpError(409, "Jus jau turite tiksla. Vienam naudotojui leidziamas tik vienas tikslas.");

    // Jei truksta privalomu lauku, requireFields ismes 422 klaida.
    requireFields(req.body, ["title", "type", "startWeightKg", "targetWeightKg", "heightCm", "age"]);

    // Kaloriju ir baltymu tikslai nera rasomi ranka, jie paskaiciuojami automatiskai.
    const targets = calculateGoalTargets(req.body);

    // Sukuriame irasa DB lenteleje Goals.
    // userId imamas is tokeno, o ne is body.
    const goal = await Goal.create({ ...pick(req.body, GOAL_FIELDS), ...targets, userId: req.user.id });
    res.status(201).json({ ...goal.toJSON(), _links: goalLinks(req, goal.id) });
  } catch (err) {
    next(err.name === "SequelizeValidationError" ? httpError(422, err.message) : err);
  }
}

async function updateGoal(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);

    // Sujungiame senus ir naujus duomenis, kad perskaiciuotume kaloriju/baltymu tikslus.
    // Imame tik leistinus laukus - jei body bus "userId", jis bus ignoruojamas.
    const changes = pick(req.body, GOAL_FIELDS);
    const nextData = { ...goal.toJSON(), ...changes };
    const targets = calculateGoalTargets(nextData);

    // update pakeicia esama DB irasa, o ne sukuria nauja.
    await goal.update({ ...changes, ...targets });
    res.json({ ...goal.toJSON(), _links: goalLinks(req, goal.id) });
  } catch (err) {
    next(err);
  }
}

async function deleteGoal(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);

    // Kadangi rysiai turi CASCADE, istrynus Goal istrinami ir jo DailyLog/FoodEntry.
    await goal.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);

    // Dashboard sujungia kelias lenteles: Goal + DailyLog + FoodEntry + Food.
    // Cia imame visus sio tikslo valgymus ir ju maisto duomenis.
    const entriesRaw = await FoodEntry.findAll({
      include: [Food, { model: DailyLog, where: { goalId: goal.id }, required: true }],
      order: [["eatenAt", "DESC"], ["id", "DESC"]]
    });

    // formatEntry paskaiciuoja kalorijas, baltymus ir kitus makroelementus pagal kieki gramais.
    const entries = entriesRaw.map(formatEntry).filter((entry) => entry.eatenAtDate);
    const daysLogged = new Set(entries.map((entry) => entry.eatenAtDate)).size;
    const totals = entries.reduce((sum, entry) => ({
      calories: sum.calories + entry.totals.calories,
      protein: sum.protein + entry.totals.protein,
      carbs: sum.carbs + entry.totals.carbs,
      fat: sum.fat + entry.totals.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.json({
      goal,
      summary: {
        daysLogged,
        entriesLogged: entries.length,
        totals,
        averageCaloriesPerDay: daysLogged ? Math.round(totals.calories / daysLogged) : 0,
        caloriesTarget: goal.dailyCaloriesTarget,
        // Baltymu vidurkis per diena (1 skaicius po kablelio) ir dienos baltymu tikslas.
        averageProteinPerDay: daysLogged ? Math.round((totals.protein / daysLogged) * 10) / 10 : 0,
        proteinTarget: goal.dailyProteinTarget
      },
      recentEntries: entries.slice(0, 5),
      _links: goalLinks(req, goal.id)
    });
  } catch (err) {
    next(err);
  }
}

async function findGoal(req, goalId) {
  // Pagalbinis metodas naudojamas daugelyje kontroleriu, kad nereiketu kartoti tos pacios 404 logikos.
  const goal = await Goal.findByPk(goalId);
  if (!goal) throw httpError(404, "Tikslas nerastas");
  ensureGoalAccess(req, goal);
  return goal;
}

function goalLinks(req, goalId) {
  // Hypermedia nuorodos leidzia API atsakyme matyti, kokie susije veiksmai yra galimi.
  const base = `${req.protocol}://${req.get("host")}/api/goals/${goalId}`;
  return {
    self: base,
    logs: `${base}/logs`,
    dashboard: `${base}/dashboard`,
    reports: `${base}/reports`,
    insights: `${base}/insights`
  };
}

module.exports = { listGoals, getGoal, createGoal, updateGoal, deleteGoal, getDashboard, findGoal };
