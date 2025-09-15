// /src/api/authStorage.js
const KEY_ACCESS = "access";
const KEY_REFRESH = "refresh";
const KEY_USER = "user";

function emitAuthChange() {
  window.dispatchEvent(new Event("auth:user"));
}

export function setAccess(token) {
  localStorage.setItem(KEY_ACCESS, token);
}
export function getAccess() {
  return localStorage.getItem(KEY_ACCESS);
}

export function setRefresh(token) {
  localStorage.setItem(KEY_REFRESH, token);
}
export function getRefresh() {
  return localStorage.getItem(KEY_REFRESH);
}

export function setUser(user) {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
  emitAuthChange();
}

export function getUser() {
  const raw = localStorage.getItem(KEY_USER);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_USER);
  emitAuthChange();
}

/** ✅ NUEVO: util para saber si hay sesión válida */
export function isAuthed() {
  return !!getAccess() && !!getUser();
}
