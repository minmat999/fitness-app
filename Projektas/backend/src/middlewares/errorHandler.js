// Visi kontroleriai meta klaidas cia, kad klientas negautu netvarkingu 500 atsakymu.
function errorHandler(err, req, res, next) {
  // Blogas JSON body turi grizti kaip 400, nes klientas atsiunte neteisinga uzklausa.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Neteisingas JSON formatas" });
  }

  // Bandoma istrinti irasa, kuris naudojamas kitur (pvz. maistas jau yra valgymuose) - tai konfliktas, 409.
  // Atskiras pranesimas, kad naudotojui nebutu rodoma SQL klaida su lenteliu pavadinimais.
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ error: "Šis įrašas naudojamas kitur (pvz. valgymuose), todėl jo ištrinti negalima" });
  }

  // Sequelize validacijos klaidos reiskia blogus duomenis, o ne serverio gedima.
  if (err.name && err.name.startsWith("Sequelize")) {
    return res.status(422).json({ error: err.message });
  }

  const status = err.status || 500;
  const message = status === 500 ? "Vidine serverio klaida" : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
