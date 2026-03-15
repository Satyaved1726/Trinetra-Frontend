import API from "./api";

const API_BASE = import.meta.env.VITE_API_URL || "https://trinetra-backend-lzk9.onrender.com";

export const registerUser = async (data) => {
  const response = await API.post("/api/auth/register", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await API.post("/api/auth/login", data);
  return response.data;
};

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/employee/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();
  console.log("Employee login response:", data);

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("userEmail", data.email ?? email);
  localStorage.setItem("userRole", data.role ?? "EMPLOYEE");

  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("trinetra_token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("trinetra_session");
  window.location.href = "/auth/employee-login";
}

const parseJwtClaims = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const extractToken = (response) => {
  return response?.token ?? response?.jwt ?? response?.accessToken ?? null;
};

const inferRole = (response, token, fallbackRole) => {
  if (response?.role) return response.role;

  const claims = parseJwtClaims(token);
  const claimRole =
    claims?.role ??
    claims?.roles ??
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  if (typeof claimRole === "string") {
    if (/admin/i.test(claimRole)) return "ADMIN";
    if (/employee|user/i.test(claimRole)) return "EMPLOYEE";
  }

  return fallbackRole;
};

const toSession = (response, fallbackRole) => {
  const token = extractToken(response);
  if (!token) {
    throw new Error("Login succeeded but no token was returned by the server.");
  }

  const role = inferRole(response, token, fallbackRole);

  return {
    token,
    user: {
      id: response?.user?.id,
      name: response?.user?.name,
      email: response?.user?.email ?? "",
      role
    }
  };
};

const parseError = (error) => {
  if (error?.response?.data?.message) return String(error.response.data.message);
  if (error?.response?.data?.error) return String(error.response.data.error);
  if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length > 0) {
    return String(error.response.data.errors[0]);
  }
  if (error?.response?.data?.validationErrors && typeof error.response.data.validationErrors === "object") {
    const messages = Object.values(error.response.data.validationErrors).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  if (error?.message) return String(error.message);
  return "Request failed. Please try again.";
};

const requestWithFallback = async (requests) => {
  let lastError;

  for (const request of requests) {
    try {
      const result = await request();
      if (result && typeof result === "object" && "data" in result) {
        return result.data;
      }

      return result;
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

export const authService = {
  async loginAdmin(payload) {
    console.log("Login request payload:", { email: payload.email });
    const response = await requestWithFallback([
      () => loginUser(payload),
      () => API.post("/auth/admin/login", payload),
      () => API.post("/auth/login", payload)
    ]);

    console.log("Login response:", response);

    return toSession(response, "ADMIN");
  },

  async loginEmployee(payload) {
    console.log("Employee login request payload:", { email: payload.email });
    const response = await login(payload.email, payload.password);

    console.log("Employee login response:", response);

    return toSession(response, "EMPLOYEE");
  },

  async registerAdmin(payload) {
    console.log("Register request payload:", { name: payload.name, email: payload.email });
    const response = await requestWithFallback([
      () => registerUser(payload),
      async () => {
        const fallback = await API.post("/auth/register", payload);
        return fallback.data;
      }
    ]);

    console.log("Register response:", response);
    return response;
  },

  async registerEmployee(payload) {
    console.log("Employee register request payload:", { name: payload.name, email: payload.email });
    const response = await requestWithFallback([
      () => registerUser(payload),
      async () => {
        const employeeResponse = await API.post("/auth/employee/register", payload);
        return employeeResponse.data;
      },
      async () => {
        const fallback = await API.post("/auth/register", payload);
        return fallback.data;
      }
    ]);

    console.log("Employee register response:", response);
    return response;
  }
};