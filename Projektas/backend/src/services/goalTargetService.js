// Paprasta automatine tikslo norma. L2/L3 galima pakeisti tikslesne formule.
function calculateGoalTargets(data) {
  // Is formos ateina tekstines reiksmes, todel jas paverciame i skaicius.
  const weight = Number(data.startWeightKg);
  const height = Number(data.heightCm);
  const age = Number(data.age);

  // Mifflin-St Jeor formule su vyrisko profilio konstanta, nes L0 projekte naudotojo lyties lauko nera.
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const maintenance = Math.round(bmr * 1.375);

  // Raumenu auginimui pridedame kaloriju pertekliu ir didesni baltymu tiksla.
  if (data.title === "Auginti raumenis") {
    return {
      dailyCaloriesTarget: maintenance + 300,
      dailyProteinTarget: Math.round(weight * 2)
    };
  }

  // Svorio islaikymui paliekame palaikymo kalorijas.
  if (data.title === "Islaikyti svori") {
    return {
      dailyCaloriesTarget: maintenance,
      dailyProteinTarget: Math.round(weight * 1.6)
    };
  }

  // Jei ne raumenu auginimas ir ne islaikymas, laikome, kad tikslas yra svorio mazinimas.
  return {
    dailyCaloriesTarget: Math.max(1200, maintenance - 500),
    dailyProteinTarget: Math.round(weight * 1.8)
  };
}

module.exports = { calculateGoalTargets };
