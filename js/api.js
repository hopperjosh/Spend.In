const BASE_URL = "/api";

// ambil token dari localStorage
const getToken = () => localStorage.getItem("token");

// helper request
const request = async (endpoint, method = "GET", data = null) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan bro");
  }

  return result;
};

// ================== AUTH ==================
export const authAPI = {
  register: (data) => request("/register", "POST", data),

  login: async (data) => {
    const result = await request("/login", "POST", data);
    localStorage.setItem("token", result.token);
    return result;
  },

  profile: () => request("/profile"),

  logout: () => {
    localStorage.removeItem("token");
  },
};

// ================== TRANSACTIONS ==================
export const transactionAPI = {
  getAll: () => request("/transactions"),

  add: (data) => request("/transactions", "POST", data),

  delete: (id) => request(`/transactions/${id}`, "DELETE"),

  update: (id, data) => request(`/transactions/${id}`, "PUT", data),

  summary: () => request("/transactions/summary"),
};
