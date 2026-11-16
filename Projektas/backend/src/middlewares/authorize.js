const { httpError } = require("../utils");

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, "Reikalingas prisijungimas"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(httpError(403, "Neturite teisiu siam veiksmui"));
    }
    next();
  };
}

module.exports = authorize;