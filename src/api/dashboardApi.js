import { apiClient } from "./axiosAPI";

export const fetchPropietarios = async () => {
  const { data } = await apiClient.get("/admin/propietarios/");
  // data es un array
  return data;
};
