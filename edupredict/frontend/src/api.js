import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("edupredict_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const onAuthPage = ["/login", "/register"].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem("edupredict_token");
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) =>
  err.response?.data?.error || "Can't reach the server. Check your connection and try again.";
export const fieldErrors = (err) => err.response?.data?.fields || {};

export default api;
