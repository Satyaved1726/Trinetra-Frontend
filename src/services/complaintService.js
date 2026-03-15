import API from "./api";

export const createComplaint = (data) => {
  const hasFiles = Array.isArray(data?.evidenceFiles) && data.evidenceFiles.length > 0;

  if (hasFiles) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("anonymous", String(Boolean(data.anonymous)));

    data.evidenceFiles.forEach((file) => {
      formData.append("files", file);
    });

    return API.post("/api/complaints", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }

  return API.post("/api/complaints", {
    title: data.title,
    description: data.description,
    category: data.category,
    anonymous: Boolean(data.anonymous)
  });
};

export const getComplaints = () => {
  return API.get("/api/complaints");
};

export const getComplaintByTrackingId = (trackingId) => {
  return API.get(`/api/complaints/${encodeURIComponent(trackingId)}`);
};

const parseError = (error) => {
  if (error?.response?.data?.message) return String(error.response.data.message);
  if (error?.response?.data?.error) return String(error.response.data.error);
  if (error?.message) return String(error.message);
  return "Request failed. Please try again.";
};

const requestWithFallback = async (requests) => {
  let lastError;

  for (const request of requests) {
    try {
      const response = await request();
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status && ![404, 405].includes(status)) {
        throw new Error(parseError(error));
      }
    }
  }

  throw new Error(parseError(lastError));
};

export const complaintService = {
  async submitComplaint(payload, options) {
    const files = payload?.evidenceFiles ?? [];

    if (files.length > 0) {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("category", payload.category);
      formData.append("anonymous", String(Boolean(payload.anonymous)));
      files.forEach((file) => formData.append("files", file));

      return requestWithFallback([
        () =>
          API.post("/api/complaints", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            },
            onUploadProgress: (event) => {
              const total = event.total ?? 0;
              const percent = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
              files.forEach((file) => options?.onUploadProgress?.(file.name, percent));
            }
          }),
        () => API.post("/complaints", formData, { headers: { "Content-Type": "multipart/form-data" } })
      ]);
    }

    const requestBody = {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      anonymous: Boolean(payload.anonymous)
    };

    return requestWithFallback([
      () => createComplaint(requestBody),
      () => API.post("/complaints", requestBody),
      () => API.post(payload.anonymous ? "/complaints/anonymous" : "/complaints/submit", requestBody)
    ]);
  },

  async trackComplaint(trackingId) {
    return requestWithFallback([
      () => getComplaintByTrackingId(trackingId),
      () => API.get(`/complaints/track/${encodeURIComponent(trackingId)}`),
      () => API.get(`/complaints/${encodeURIComponent(trackingId)}`)
    ]);
  },

  async getMyComplaints() {
    return requestWithFallback([
      () => getComplaints(),
      () => API.get("/employee/complaints"),
      () => API.get("/complaints/me")
    ]);
  },

  async addComment(complaintId, message) {
    return requestWithFallback([
      () => API.post(`/api/complaints/${encodeURIComponent(complaintId)}/comments`, { message }),
      () => API.post(`/complaints/${encodeURIComponent(complaintId)}/comments`, { message }),
      () => API.post(`/employee/complaints/${encodeURIComponent(complaintId)}/comments`, { message })
    ]);
  },

  async uploadAdditionalEvidence(complaintId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return requestWithFallback([
      () =>
        API.post(`/api/complaints/${encodeURIComponent(complaintId)}/evidence`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
      () =>
        API.post(`/complaints/${encodeURIComponent(complaintId)}/evidence`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
    ]);
  }
};