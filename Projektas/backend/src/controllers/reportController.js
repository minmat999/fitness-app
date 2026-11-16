const { Op } = require("sequelize");
const { DailyLog, Food, FoodEntry } = require("../models");
const { findGoal } = require("./goalController");
const { generateInsight } = require("../services/geminiService");
const { formatEntry } = require("../services/nutritionService");
const { links } = require("../utils");

async function getReports(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);
    const entries = await loadEntries(goal.id);
    const logs = await loadLogs(goal.id);
    const period = req.query.period || "day";
    const date = req.query.date || localDate();
    res.json({
      goal,
      report: buildReport(entries, logs, goal, period, date),
      _links: links(req, {
        goal: `${req.protocol}://${req.get("host")}/api/goals/${goal.id}`,
        insights: `${req.protocol}://${req.get("host")}/api/goals/${goal.id}/insights`
      })
    });
  } catch (err) {
    next(err);
  }
}

async function getInsights(req, res, next) {
  try {
    const goal = await findGoal(req, req.params.goalId);
    const entries = await loadEntries(goal.id);
    const logs = await loadLogs(goal.id);
    const period = req.query.period || "day";
    const date = req.query.date || localDate();
    const report = buildReport(entries, logs, goal, period, date);
    const insight = await generateInsight({ goal, report, latestDays: report.days.slice(0, 7) });
    res.json({ goalId: goal.id, insight, _links: links(req) });
  } catch (err) {
    next(err);
  }
}

async function loadLogs(goalId) {
  return DailyLog.findAll({
    where: { goalId, date: { [Op.ne]: null } },
    order: [["date", "DESC"]]
  });
}

async function loadEntries(goalId) {
  return FoodEntry.findAll({
    include: [Food, { model: DailyLog, where: { goalId }, required: true }],
    order: [["eatenAt", "ASC"], ["id", "ASC"]]
  });
}

function buildReport(rawEntries, logs, goal, period, selectedDate) {
  const logsByDate = new Map(logs.map((log) => [log.date, log]));
  const entries = rawEntries.map(formatEntry).filter((entry) => entry.eatenAtDate);
  const filteredEntries = entries.filter((entry) => inPeriod(entry.eatenAtDate, selectedDate, period));
  const grouped = groupByDate(filteredEntries);

  const daily = Array.from(grouped.entries()).map(([date, dayEntries]) => {
    const log = logsByDate.get(date);
    const totals = sumEntries(dayEntries);
    return {
      date,
      weightKg: log?.weightKg || null,
      activity: log?.activity || null,
      note: log?.note || null,
      entries: dayEntries,
      totals,
      caloriesDifference: totals.calories - goal.dailyCaloriesTarget
    };
  });

  return { period, selectedDate, days: daily, summary: summarize(daily, goal) };
}

function groupByDate(entries) {
  return entries.reduce((groups, entry) => {
    if (!groups.has(entry.eatenAtDate)) groups.set(entry.eatenAtDate, []);
    groups.get(entry.eatenAtDate).push(entry);
    return groups;
  }, new Map());
}

function sumEntries(entries) {
  return entries.reduce((sum, entry) => ({
    calories: sum.calories + entry.totals.calories,
    protein: sum.protein + entry.totals.protein,
    carbs: sum.carbs + entry.totals.carbs,
    fat: sum.fat + entry.totals.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function summarize(days, goal) {
  const totals = days.reduce((sum, day) => ({
    calories: sum.calories + day.totals.calories,
    protein: sum.protein + day.totals.protein,
    carbs: sum.carbs + day.totals.carbs,
    fat: sum.fat + day.totals.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const caloriesTarget = goal.dailyCaloriesTarget * days.length;
  const proteinTarget = goal.dailyProteinTarget * days.length;

  return {
    days: days.length,
    totals,
    targets: { calories: caloriesTarget, protein: proteinTarget },
    difference: {
      calories: totals.calories - caloriesTarget,
      protein: totals.protein - proteinTarget
    },
    averageCalories: days.length ? Math.round(totals.calories / days.length) : 0,
    caloriesTarget // paliktas atgaliniam suderinamumui, jei kažkur dar naudojamas
  };
}

function inPeriod(day, selectedDate, period) {
  const current = new Date(`${day}T00:00:00`);
  const selected = new Date(`${selectedDate}T00:00:00`);
  if (period === "day") return day === selectedDate;
  if (period === "month") return current.getFullYear() === selected.getFullYear() && current.getMonth() === selected.getMonth();

  const start = new Date(selected);
  start.setDate(selected.getDate() - selected.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return current >= start && current <= end;
}

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = { getReports, getInsights };