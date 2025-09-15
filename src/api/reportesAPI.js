// /src/api/reportesAPI.js
import { apiClient } from "./axiosAPI";

const BASE = "/admin/reportes/";

// Lista (puedes pasar params: ?search=&ordering=&estado=&tipo=&prioridad=)
export const fetchReportes = async (params = {}) => {
  const { data } = await apiClient.get(BASE, { params });
  return data; // array
};

export const fetchReporte = async (id) => {
  const { data } = await apiClient.get(`${BASE}${id}/`);
  return data;
};

// Crea. Acepta JSON o FormData si mandas archivo
export const createReporte = async (payload, hasFile = false) => {
  if (hasFile) {
    const { data } = await apiClient.post(BASE, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await apiClient.post(BASE, payload);
  return data;
};

export const updateReporte = async (id, payload, hasFile = false) => {
  if (hasFile) {
    const { data } = await apiClient.put(`${BASE}${id}/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await apiClient.put(`${BASE}${id}/`, payload);
  return data;
};

export const deleteReporte = async (id) => {
  await apiClient.delete(`${BASE}${id}/`);
  return true;
};
