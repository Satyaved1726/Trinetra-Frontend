import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://trinetra-backend-lzk9.onrender.com";

const API = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

export async function apiRequest(endpoint, options = {}) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

API.interceptors.request.use((config) => {
  const token =
    window.localStorage.getItem("token") ??
    window.localStorage.getItem("trinetra_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  async adminLogin(payload) {
    const response = await API.post("/api/auth/login", payload);
    return response.data;
  },
  async employeeLogin(payload) {
    const response = await API.post("/api/auth/login", payload);
    return response.data;
  },
  async register(payload) {
    await API.post("/api/auth/register", payload);
  },
  async registerEmployee(payload) {
    await API.post("/api/auth/register", payload);
  }
};

export const complaintsApi = {
  async submitComplaint(payload) {
    const token = window.localStorage.getItem("token");
    const isAnonymous = Boolean(payload.anonymous);

    const response = await fetch(`${API_BASE}/api/complaints/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(!isAnonymous && token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        isAnonymous
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Unable to submit complaint.");
    }

    return data;
  },
  async trackComplaint(trackingId, anonymousToken) {
    const response = await fetch(`${API_BASE}/api/complaints/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trackingId,
        ...(anonymousToken ? { anonymousToken } : {})
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Unable to track complaint.");
    }

    return data;
  },
  async getComplaints() {
    const response = await API.get("/api/complaints");
    return response.data;
  },
  async updateComplaintStatus(complaintId, status) {
    const response = await API.patch(`/api/admin/complaints/${encodeURIComponent(String(complaintId))}/status`, {
      status
    });
    return response.data;
  },
  async getMyComplaints() {
    const response = await API.get("/api/complaints");
    return response.data;
  },
  async addComment(complaintId, message) {
    const response = await API.post(`/api/complaints/${encodeURIComponent(complaintId)}/comments`, { message });
    return response.data;
  },
  async uploadAdditionalEvidence(complaintId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await API.post(`/api/complaints/${encodeURIComponent(complaintId)}/evidence`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return response.data;
  }
};

export default API;