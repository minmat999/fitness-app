function notFound(req, res) {
  res.status(404).json({ error: "Toks API kelias nerastas" });
}

module.exports = notFound;
