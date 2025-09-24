import axios from "axios";

const BASE_URL = "https://disposable-integration.onrender.com";
export default BASE_URL;

export const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
});