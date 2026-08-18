import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

function authConfig(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function fetchAdminOverview(token) {
  const response = await axios.get(`${baseURL}/admin/overview`, authConfig(token));
  return response.data;
}

export async function fetchAdminUsers(token) {
  const response = await axios.get(`${baseURL}/admin/users?limit=100`, authConfig(token));
  return response.data;
}

export async function fetchAdminReports(token) {
  const response = await axios.get(`${baseURL}/admin/reports`, authConfig(token));
  return response.data;
}

export async function updateAdminUser(token, userId, updates) {
  const response = await axios.patch(
    `${baseURL}/admin/users/${userId}`,
    updates,
    authConfig(token),
  );
  return response.data.user;
}

export async function deleteAdminUser(token, userId) {
  const response = await axios.delete(`${baseURL}/admin/users/${userId}`, authConfig(token));
  return response.data;
}

