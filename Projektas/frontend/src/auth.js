// API adresas laikomas vienoje vietoje. Jei bus nustatytas VITE_FITNESS_API_URL (pvz. publikuojant), naudojamas jis.
export const API = import.meta.env.VITE_FITNESS_API_URL || "http://localhost:3000/api";

let accessToken = null;
let listeners = [];

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
  listeners.forEach((fn) => fn(token));
}

// Leidzia App komponentui "uzsiprenumeruoti" tokeno pasikeitima (pvz. po login/logout).
export function onAuthChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((listener) => listener !== fn); };
}

async function call(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include", // kad refresh cookie butu siunciama/priimama
    ...options
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data?.error || "Klaida");
  return data;
}

export async function register(email, password) {
  return call("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function login(email, password) {
  const data = await call("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await call("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function tryRefresh() {
  try {
    const data = await call("/auth/refresh", { method: "POST" });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function fetchMe() {
  return call("/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
}
