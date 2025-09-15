// /src/api/expensasAPI.js
import { apiClient } from "./axiosAPI";

const BASE = "/admin/expensas/";

// GET: lista (opcionalmente con params ?search=&ordering=)
export const fetchExpensas = async (params = {}) => {
  const { data } = await apiClient.get(BASE, { params });
  return data; // array
};

// GET una
export const fetchExpensa = async (id) => {
  const { data } = await apiClient.get(`${BASE}${id}/`);
  return data;
};

// POST crear
export const createExpensa = async (payload) => {
  const { data } = await apiClient.post(BASE, payload);
  return data;
};

// PUT/PATCH editar
export const updateExpensa = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}${id}/`, payload);
  return data;
};

// DELETE eliminar
export const deleteExpensa = async (id) => {
  await apiClient.delete(`${BASE}${id}/`);
  return true;
};
