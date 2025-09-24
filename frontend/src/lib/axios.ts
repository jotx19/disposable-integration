import axios from "axios";

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://disposable-integration.onrender.com"
    : "http://localhost:5001";

export const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
});