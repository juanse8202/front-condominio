// /src/api/loginAPI.js
import { apiClient } from "./axiosAPI";

/**
 * POST /auth/login/ -> { access, refresh, user }
 */
export const loginUser = async (username, password) => {
  const { data } = await apiClient.post("/auth/login/", { username, password });

  if (data?.access) localStorage.setItem("access", data.access);
  if (data?.refresh) localStorage.setItem("refresh", data.refresh);
  if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};
