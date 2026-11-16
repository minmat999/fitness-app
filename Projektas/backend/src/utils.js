function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function pageOptions(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
  return { page, limit, offset: (page - 1) * limit };
}

function pagination(count, page, limit) {
  return { page, limit, total: count, pages: Math.ceil(count / limit) };
}

function links(req, extra = {}) {
  return { self: `${req.protocol}://${req.get("host")}${req.originalUrl}`, ...extra };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === "");
  if (missing.length) throw httpError(422, `Truksta lauku: ${missing.join(", ")}`);
}

// Is kliento atsiusto body paima TIK leistinus laukus (whitelist).
// Taip naudotojas negali per PUT/POST atsiusti pvz. userId, goalId ar dailyLogId
// ir "perkelti" savo irasa i svetima paskyra (apsauga nuo "mass assignment").
function pick(body, allowedFields) {
  const result = {};
  for (const field of allowedFields) {
    if (body && Object.prototype.hasOwnProperty.call(body, field)) result[field] = body[field];
  }
  return result;
}

// Savininkas arba admin visada gali; kitas "user" - NIEKADA (rolė čia neapsaugo nuo svetimo tikslo).
function ensureGoalAccess(req, goal) {
  if (req.user.role === "admin") return;
  if (goal.userId === Number(req.user.id)) return;
  throw httpError(403, "Neturite teisiu siam tikslui");
}

module.exports = { httpError, pageOptions, pagination, links, requireFields, ensureGoalAccess, pick };
