// Skaiciuojame maistine verte pagal maisto reiksmes 100 g ir vartotojo pasirinkta kieki.
function formatEntry(entry) {
  const food = entry.Food;
  const data = entry.toJSON();
  const factor = Number(entry.quantityGrams) / 100;
  const eatenAt = splitMysqlDateTime(data.eatenAt);
  return {
    ...data,
    eatenAtDate: eatenAt?.date || null,
    eatenAtTime: eatenAt?.time || null,
    foodName: food?.name,
    totals: food ? {
      calories: Math.round(food.caloriesPer100g * factor),
      protein: round(food.proteinPer100g * factor),
      carbs: round(food.carbsPer100g * factor),
      fat: round(food.fatPer100g * factor)
    } : { calories: 0, protein: 0, carbs: 0, fat: 0 }
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function splitMysqlDateTime(value) {
  if (!value) return null;

  // Sequelize DATETIME grizta kaip Date objektas UTC formatu; UTC dalys atitinka MySQL reiksme.
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

module.exports = { formatEntry };
