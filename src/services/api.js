import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

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
    const files = payload?.evidenceFiles ?? [];

    if (files.length > 0) {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("category", payload.category);
      formData.append("anonymous", String(Boolean(payload.anonymous)));
      files.forEach((file) => formData.append("files", file));

      const response = await API.post("/api/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      return response.data;
    }

    const response = await API.post("/api/complaints", {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      anonymous: Boolean(payload.anonymous)
    });

    return response.data;
  },
  async trackComplaint(trackingId) {
    const response = await API.get(`/api/complaints/${encodeURIComponent(trackingId)}`);
    return response.data;
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