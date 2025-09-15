// src/api/propietariosAPI.js
import { apiClient } from "./axiosAPI";

// GET - lista de propietarios
export const fetchPropietarios = async () => {
  const { data } = await apiClient.get("/admin/propietarios/");
  return data;
};

// POST - crear propietario
export const createPropietario = async (payload) => {
  const { data } = await apiClient.post("/admin/propietarios/", payload);
  return data;
};

// PUT/PATCH - actualizar propietario
export const updatePropietario = async (id, payload) => {
  const { data } = await apiClient.put(`/admin/propietarios/${id}/`, payload);
  return data;
  // si tu API permite PATCH en vez de PUT:
  // const { data } = await apiClient.patch(`/admin/propietarios/${id}/`, payload);
};

// DELETE - eliminar propietario
export const deletePropietario = async (id) => {
  const { data } = await apiClient.delete(`/admin/propietarios/${id}/`);
  return data;
};
