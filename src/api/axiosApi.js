// /src/api/axiosAPI.js
import axios from "axios";
import { getAccess, getRefresh, setAccess, clearAuth } from "./authStorage";

export const API_URL = "http://127.0.0.1:8000/api"; // sin slash final

export const apiClient = axios.create({
  baseURL: API_URL,
});

// ====== REFRESH TOKEN helper ======
let refreshing = null;

async function refreshAccessToken() {
  if (!refreshing) {
    const refresh = getRefresh();
    if (!refresh) throw new Error("No refresh token");
    refreshing = axios
      .post(`${API_URL}/auth/refresh/`, { refresh })
      .then(({ data }) => {
        if (data?.access) setAccess(data.access);
        return data?.access;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// ====== REQUEST: adjunta Bearer ======
apiClient.interceptors.request.use((config) => {
  const access = getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// ====== RESPONSE: intenta refresh en 401 ======
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // si 401 y no hemos reintentado aún, intenta refrescar
    if (status === 401 && !original?._retry) {
      try {
        original._retry = true;
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(original);
        }
      } catch (e) {
        // refresh falló -> limpiar sesión
        clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
