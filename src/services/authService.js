import API from "./api";

export const registerUser = (data) => {
  return API.post("/api/auth/register", data);
};

export const loginUser = (data) => {
  return API.post("/api/auth/login", data);
};

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

export const authService = {
  async loginAdmin(payload) {
    const response = await requestWithFallback([
      () => loginUser(payload),
      () => API.post("/auth/admin/login", payload),
      () => API.post("/auth/login", payload)
    ]);

    return toSession(response, "ADMIN");
  },

  async loginEmployee(payload) {
    const response = await requestWithFallback([
      () => loginUser(payload),
      () => API.post("/auth/employee/login", payload),
      () => API.post("/auth/login", payload)
    ]);

    return toSession(response, "EMPLOYEE");
  },

  async registerAdmin(payload) {
    await requestWithFallback([
      () => registerUser(payload),
      () => API.post("/auth/register", payload)
    ]);
  },

  async registerEmployee(payload) {
    await requestWithFallback([
      () => registerUser(payload),
      () => API.post("/auth/employee/register", payload),
      () => API.post("/auth/register", payload)
    ]);
  }
};