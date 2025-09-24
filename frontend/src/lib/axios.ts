import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://disposable-integration.onrender.com/api",
    withCredentials: true,
});