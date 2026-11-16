const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { httpError, requireFields } = require("../utils");
const { signAccessToken, issueRefreshToken, revokeRefreshToken, isRefreshTokenValid } = require("../services/tokenService");

const REFRESH_COOKIE = "refreshToken";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

async function register(req, res, next) {
  try {
    requireFields(req.body, ["email", "password"]);
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) throw httpError(409, "Sis el. pastas jau uzregistruotas");

    // SVARBU: role visada "user" - niekada nepasitikime kliento atsiusta role
    // (kitaip bet kas galetu registruotis kaip "admin" siusdamas role:"admin" body'je).
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ email: req.body.email, passwordHash, role: "user" });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err.name === "SequelizeValidationError" ? httpError(422, err.message) : err);
  }
}

async function login(req, res, next) {
  try {
    requireFields(req.body, ["email", "password"]);
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) throw httpError(401, "Neteisingas el. pastas arba slaptazodis");

    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) throw httpError(401, "Neteisingas el. pastas arba slaptazodis");

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user);

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    res.json({ accessToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw httpError(401, "Nerastas refresh tokenas");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw httpError(401, "Negaliojantis refresh tokenas");
    }

    const valid = await isRefreshTokenValid(token);
    if (!valid) throw httpError(401, "Refresh tokenas atsauktas arba nebegalioja");

    const user = await User.findByPk(payload.sub);
    if (!user) throw httpError(401, "Naudotojas nerastas");

    // Rotacija: senas tokenas is karto panaikinamas, isduodamas naujas -
    // net jei kas nors pavogtu sena refresh tokena, jis panaudojamas tik viena karta.
    await revokeRefreshToken(token);
    const newRefreshToken = await issueRefreshToken(user);
    const accessToken = signAccessToken(user);

    res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await revokeRefreshToken(token);
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ["id", "email", "role"] });
    if (!user) throw httpError(404, "Naudotojas nerastas");
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };