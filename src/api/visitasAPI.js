// /src/api/visitasAPI.js
import { apiClient } from "./axiosAPI";

/** Estructura base esperada por el backend (DRF) para crear/editar */
const BASE = "/admin/visitas/";

export const fetchVisitas = async () => {
  const { data } = await apiClient.get(BASE);
  return Array.isArray(data) ? data : [];
};

export const createVisita = async (payload) => {
  // el backend genera codigo_acceso y qr_code; no los mandamos
  const { data } = await apiClient.post(BASE, payload);
  return data;
};

export const updateVisita = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}${id}/`, payload);
  return data;
  // Si tu backend permite PATCH:
  // const { data } = await apiClient.patch(`${BASE}${id}/`, payload);
  // return data;
};

export const deleteVisita = async (id) => {
  await apiClient.delete(`${BASE}${id}/`);
  return true;
};
