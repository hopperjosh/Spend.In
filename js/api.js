const BASE_URL = "http://localhost:3000";

// ambil token dari localStorage
const getToken = () => localStorage.getItem("token");
const authHeader = () => {
  const token = getToken();
  if (!token) {
    throw new Error("Token tidak ditemukan, silakan login ulang");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

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
  getProfile: async () => {
    const response = await fetch(`${BASE_URL}/profile`, {
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unauthorized");

    // Normalisasi: backend mungkin kirim 'name' atau 'full_name'
    data.full_name = data.full_name || data.name || data.email || "User";
    return data;
  },

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

  getSummary: async () => {
    const response = await fetch(`${BASE_URL}/transactions/summary`, {
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal ambil summary");
    return data;
  },
};
