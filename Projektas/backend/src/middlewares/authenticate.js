const jwt = require("jsonwebtoken");
const { httpError } = require("../utils");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(httpError(401, "Trukstą prisijungimo zetono"));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(httpError(401, "Negaliojantis arba pasibaiges zetonas"));
  }
}

module.exports = authenticate;