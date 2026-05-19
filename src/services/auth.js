import axios from "axios";

const API_URL = "https://urbarberdesign-1.onrender.com/api/auth";

export const registerUser = async (userData) => {
  const res = await axios.post(`${API_URL}/register`, userData);
  return res.data;
};

export const loginUser = async (loginData) => {
  const res = await axios.post(`${API_URL}/login`, loginData);
  return res.data;
};

export const saveAuth = (data) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
};

export const getToken = () => localStorage.getItem("token");