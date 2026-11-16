const { GoogleGenAI } = require("@google/genai");

async function generateInsight(context) {
  if (!process.env.GEMINI_API_KEY) {
    return localInsight(context);
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `
Tu esi mitybos progreso pagalbininkas. Lietuviškai pateik išsamesnę, bet aiškią analizę:
1. trumpa laikotarpio santrauka;
2. kalorijų palyginimas su tikslu;
3. baltymų, angliavandenių ir riebalų pastebėjimai;
4. 3-5 konkretūs veiksmai kitam laikotarpiui.
Nediagnozuok ligų ir nepateik medicininių teiginių.

Duomenys:
${JSON.stringify(context, null, 2)}
`;

  try {
    const result = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 10000)
      )
    ]);

    return result.text;
  } catch (err) {
    console.error("Gemini API klaida:", err.message);
    return localInsight(context);
  }
}

function localInsight(context) {
  const summary = context.report?.summary || {};
  const report = context.report || {};
  const goal = context.goal || {};
  const days = report.days || [];
  const calories = summary.totals?.calories || 0;
  const protein = summary.totals?.protein || 0;
  const carbs = summary.totals?.carbs || 0;
  const fat = summary.totals?.fat || 0;
  const target = summary.caloriesTarget || goal.dailyCaloriesTarget || 0;
  const proteinTarget = (goal.dailyProteinTarget || 0) * Math.max(summary.days || 1, 1);
  const expectedCalories = target * Math.max(summary.days || 1, 1);
  const diff = calories - expectedCalories;
  const periodName = { day: "dienos", week: "savaites", month: "menesio" }[report.period] || "laikotarpio";

  if (!calories) {
    return `Pasirinktam ${periodName} laikotarpiui dar nera valgymu. Pirmiausia uzfiksuok bent kelis valgymus, tada sistema gales palyginti kalorijas, baltymus ir valgymu pasiskirstyma.`;
  }

  const calorieText = Math.abs(diff) < 150
    ? "Kalorijos yra arti pasirinkto laikotarpio tikslo."
    : diff > 0
      ? `Per pasirinkta laikotarpi suvartota apie ${Math.round(diff)} kcal daugiau nei tikslas.`
      : `Per pasirinkta laikotarpi suvartota apie ${Math.round(Math.abs(diff))} kcal maziau nei tikslas.`;

  const proteinText = proteinTarget
    ? protein >= proteinTarget * 0.9
      ? "Baltymu kiekis atrodo pakankamas pagal dabartini tiksla."
      : `Baltymu kiekis zemokas: ${round(protein)} g is mazdaug ${proteinTarget} g laikotarpio tikslo.`
    : "Baltymu tikslo palyginimui truksta duomenu.";

  const consistencyText = days.length > 1
    ? `Duomenu yra ${days.length} dienoms, todel verta ziureti ne viena diena, o bendra tendencija.`
    : "Kol kas vertinama viena diena, todel isvada gali stipriai keistis pridejus daugiau irasu.";

  return [
    `Pasirinkto ${periodName} laikotarpio santrauka: ${calories} kcal, ${round(protein)} g baltymu, ${round(carbs)} g angliavandeniu ir ${round(fat)} g riebalu.`,
    calorieText,
    proteinText,
    consistencyText,
    "Rekomendacijos: planuok pagrindinius valgymus is anksto, prie kiekvieno pagrindinio valgymo pridek baltymu saltini, o uzkandzius naudok tik tarpams uzpildyti, ne pagrindiniam kaloriju kiekiui surinkti.",
    "Kitam laikotarpiui verta stebeti, ar kaloriju skirtumas kartojasi kasdien, ir pagal tai koreguoti porciju dydi, o ne pavienius atsitiktinius valgymus."
  ].join("\n\n");
}

function round(value) {
  return Math.round(value * 10) / 10;
}

module.exports = { generateInsight };
