const { Op } = require("sequelize");
const { Food } = require("../models");
const { httpError, pageOptions, pagination, links, requireFields, pick } = require("../utils");

// Leistini maisto laukai (id, createdAt ir pan. klientas nustatyti negali).
const FOOD_FIELDS = ["name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"];

async function listFoods(req, res, next) {
  try {
    const { page, limit, offset } = pageOptions(req.query);
    const where = req.query.search ? { name: { [Op.like]: `%${req.query.search}%` } } : {};
    const result = await Food.findAndCountAll({ where, limit, offset, order: [["name", "ASC"]] });
    res.json({ data: result.rows, pagination: pagination(result.count, page, limit), _links: links(req) });
  } catch (err) {
    next(err);
  }
}

async function getFood(req, res, next) {
  try {
    res.json(await findFood(req.params.foodId));
  } catch (err) {
    next(err);
  }
}

async function createFood(req, res, next) {
  try {
    requireFields(req.body, ["name", "caloriesPer100g"]);
    const food = await Food.create(pick(req.body, FOOD_FIELDS));
    res.status(201).json(food);
  } catch (err) {
    next(err);
  }
}

async function updateFood(req, res, next) {
  try {
    const food = await findFood(req.params.foodId);
    await food.update(pick(req.body, FOOD_FIELDS));
    res.json(food);
  } catch (err) {
    next(err);
  }
}

async function deleteFood(req, res, next) {
  try {
    const food = await findFood(req.params.foodId);
    await food.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function findFood(foodId) {
  const food = await Food.findByPk(foodId);
  if (!food) throw httpError(404, "Maistas nerastas");
  return food;
}

module.exports = { listFoods, getFood, createFood, updateFood, deleteFood, findFood };
