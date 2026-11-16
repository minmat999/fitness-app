const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { RefreshToken } = require("../models");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d"
  });
  const decoded = jwt.decode(token);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(decoded.exp * 1000)
  });
  return token;
}

async function revokeRefreshToken(token) {
  await RefreshToken.update({ revoked: true }, { where: { tokenHash: hashToken(token) } });
}

async function isRefreshTokenValid(token) {
  const stored = await RefreshToken.findOne({ where: { tokenHash: hashToken(token), revoked: false } });
  if (!stored) return false;
  if (stored.expiresAt < new Date()) return false;
  return true;
}

module.exports = { signAccessToken, issueRefreshToken, revokeRefreshToken, isRefreshTokenValid };