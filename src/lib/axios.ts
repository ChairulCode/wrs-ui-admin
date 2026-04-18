import axios from "axios";

const api = axios.create({
  baseURL: `${(import.meta.env.VITE_BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
