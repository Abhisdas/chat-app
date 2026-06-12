import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

axiosInstance.interceptors.request.use((config) => {
  const saved = localStorage.getItem("talenthunt_mock_user");
  if (saved) {
    const user = JSON.parse(saved);
    config.headers["x-mock-user-id"] = user.id;
    config.headers["x-mock-user-email"] = user.primaryEmailAddress.emailAddress;
    config.headers["x-mock-user-name"] = user.fullName;
    config.headers["x-mock-user-image"] = user.imageUrl;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
