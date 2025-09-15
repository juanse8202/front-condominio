// /src/api/authAPI.js
import axios from "axios";
import { API_URL } from "./axiosAPI";
import { setAccess, setRefresh, setUser, clearAuth } from "./authStorage";

/**
 * Espera: POST /auth/login/ -> { access, refresh, user }
 */
export async function login(username, password) {
  const { data } = await axios.post(`${API_URL}/auth/login/`, { username, password });
  if (data?.access) setAccess(data.access);
  if (data?.refresh) setRefresh(data.refresh);
  if (data?.user) setUser(data.user);
  return data;
}

export function logout() {
  clearAuth();
}
