const { Op } = require("sequelize");
const { DailyLog, Food, FoodEntry } = require("../models");
const { findFood } = require("./foodController");
const { findLog } = require("./logController");
const { httpError, pageOptions, pagination, links, requireFields, pick } = require("../utils");

// Leistini valgymo iraso laukai. dailyLogId cia NERA - jis visada imamas is URL.
// eatenAt apdorojamas atskirai per normalizeEatenAt.
const ENTRY_FIELDS = ["foodId", "mealType", "quantityGrams"];
const { formatEntry } = require("../services/nutritionService");

async function listEntries(req, res, next) {
  try {
    // Patikriname, ar nurodytas dienos irasas tikrai priklauso nurodytam tikslui (ir tikslas - vartotojui).
    const log = await findLog(req, req.params.goalId, req.params.logId);
    const { page, limit, offset } = pageOptions(req.query);
    const where = {};
    if (req.query.mealType) where.mealType = req.query.mealType;

    // Svarbu: kai paduota date, valgymus filtruojame pagal FoodEntry.eatenAt data.
    // Taip ataskaitos ir valgymu istorija remiasi realiu valgymo laiku, ne tik DailyLog.date.
    if (req.query.date) {
      where.eatenAt = {
        [Op.gte]: `${req.query.date} 00:00:00`,
        [Op.lte]: `${req.query.date} 23:59:59`
      };
    } else {
      where.dailyLogId = log.id;
    }

    const result = await FoodEntry.findAndCountAll({
      where,
      // include prideda Food duomenis ir patikrina, kad valgymas priklausytu tam paciam goalId.
      include: [Food, { model: DailyLog, where: { goalId: req.params.goalId }, attributes: ["id", "date"], required: true }],
      limit,
      offset,
      order: [["eatenAt", "ASC"], ["id", "ASC"]]
    });
    res.json({
      data: result.rows.map((entry) => ({ ...formatEntry(entry), _links: entryLinks(req, entry.dailyLogId, entry.id) })),
      pagination: pagination(result.count, page, limit),
      _links: links(req)
    });
  } catch (err) {
    next(err);
  }
}

async function getEntry(req, res, next) {
  try {
    // Grazinamas vienas valgymo irasas su paskaiciuota maistine verte.
    const entry = await findEntry(req, req.params.goalId, req.params.logId, req.params.entryId);
    res.json({ ...formatEntry(entry), _links: entryLinks(req, req.params.logId, entry.id) });
  } catch (err) {
    next(err);
  }
}

async function createEntry(req, res, next) {
  try {
    const log = await findLog(req, req.params.goalId, req.params.logId);

    // foodId - pasirenkamas maistas, mealType - pusryciai/pietus/vakariene/uzkandis, quantityGrams - kiekis.
    requireFields(req.body, ["foodId", "mealType", "quantityGrams"]);

    // Patikriname, ar nurodytas maistas egzistuoja Foods lenteleje.
    await findFood(req.body.foodId);

    // Frontend gali siusti tik HH:mm, todel cia paverciame i pilna DATETIME.
    const eatenAt = normalizeEatenAt(req.body.eatenAt, log.date);

    // Pusryciai, pietus ir vakariene gali buti tik po viena per diena; uzkandziu gali buti daug.
    await ensureUniqueMainMeal(req.params.goalId, req.body.mealType, eatenAt);

    const entry = await FoodEntry.create({ ...pick(req.body, ENTRY_FIELDS), eatenAt, dailyLogId: log.id });
    const saved = await FoodEntry.findByPk(entry.id, { include: Food });
    res.status(201).json({ ...formatEntry(saved), _links: entryLinks(req, log.id, entry.id) });
  } catch (err) {
    next(err);
  }
}

async function updateEntry(req, res, next) {
  try {
    const entry = await findEntry(req, req.params.goalId, req.params.logId, req.params.entryId);
    if (req.body.foodId) await findFood(req.body.foodId);

    // Jei mealType/eatenAt keiciasi, dar karta tikriname pagrindinio valgymo unikaluma.
    const nextMealType = req.body.mealType || entry.mealType;
    const nextEatenAt = req.body.eatenAt !== undefined ? normalizeEatenAt(req.body.eatenAt, entry.DailyLog?.date) : entry.eatenAt;
    await ensureUniqueMainMeal(req.params.goalId, nextMealType, nextEatenAt, entry.id);
    // Jei body bus "dailyLogId", jis bus ignoruojamas - irasas liks savo dienoje.
    await entry.update({
      ...pick(req.body, ENTRY_FIELDS),
      eatenAt: nextEatenAt
    });
    const saved = await FoodEntry.findByPk(entry.id, { include: Food });
    res.json({ ...formatEntry(saved), _links: entryLinks(req, req.params.logId, entry.id) });
  } catch (err) {
    next(err);
  }
}

function normalizeEatenAt(value, date) {
  // Priimame kelis formatus, kad API butu patogu naudoti per frontend ir Postman.
  if (!value) return `${date} 00:00:00`;
  if (/^\d{2}:\d{2}$/.test(value)) return `${date} ${value}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return `${date} ${value}`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2} /.test(value)) return value;
  return `${date} 00:00:00`;
}

async function ensureUniqueMainMeal(goalId, mealType, eatenAt, ignoredEntryId) {
  // Uzkandziams ribojimo nera.
  if (mealType === "snack") return;
  const day = datePart(eatenAt);

  // Ieskome, ar ta pacia eatenAt diena jau yra toks pat pagrindinis valgymas.
  const existing = await FoodEntry.findOne({
    where: {
      mealType,
      eatenAt: {
        [Op.gte]: `${day} 00:00:00`,
        [Op.lte]: `${day} 23:59:59`
      }
    },
    include: { model: DailyLog, where: { goalId }, required: true }
  });
  if (existing && existing.id !== Number(ignoredEntryId)) {
    throw httpError(409, "Siai dienai toks valgymas jau uzfiksuotas. Pakartotinai galima prideti tik uzkandi.");
  }
}

function datePart(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

async function deleteEntry(req, res, next) {
  try {
    const entry = await findEntry(req, req.params.goalId, req.params.logId, req.params.entryId);
    await entry.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function findEntry(req, goalId, logId, entryId) {
  // Apsauga: entry turi priklausyti butent tam logId, kuris yra URL, o logId - tam goalId, kuris priklauso vartotojui.
  const log = await findLog(req, goalId, logId);
  const entry = await FoodEntry.findOne({ where: { id: entryId, dailyLogId: log.id }, include: [Food, { association: FoodEntry.associations.DailyLog }] });
  if (!entry) throw httpError(404, "Maisto irasas nerastas tame dienos irase");
  return entry;
}

function entryLinks(req, logId, entryId) {
  return {
    self: `${req.protocol}://${req.get("host")}${req.baseUrl}/${entryId}`,
    log: `${req.protocol}://${req.get("host")}${req.baseUrl}`
  };
}

module.exports = { listEntries, getEntry, createEntry, updateEntry, deleteEntry };