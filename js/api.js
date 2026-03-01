const BASE_URL = "http://localhost:3000";

// =============================
// 🔐 HELPER
// =============================
const getToken = () => {
  return localStorage.getItem("token");
};

const authHeader = () => {
  const token = getToken();
  if (!token) {
    throw new Error("Token tidak ditemukan, silakan login ulang");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// =============================
// 🔐 AUTH API
// =============================
export const authAPI = {
  // REGISTER
  register: async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Register gagal");
    return data;
  },

  // LOGIN
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login gagal");
    localStorage.setItem("token", data.token);
    return data;
  },

  // GET PROFILE
  // Normalize field nama agar konsisten: selalu ada .full_name
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

  // LOGOUT
  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "Utama/login.html";
  },
};

// =============================
// 💸 TRANSACTION API
// =============================
export const transactionAPI = {
  // GET ALL TRANSACTIONS
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal ambil transaksi");
    return data;
  },

  // GET SINGLE TRANSACTION BY ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Transaksi tidak ditemukan");
    return data;
  },

  // GET SUMMARY
  getSummary: async () => {
    const response = await fetch(`${BASE_URL}/transactions/summary`, {
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal ambil summary");
    return data;
  },

  // ADD TRANSACTION
  // Catatan: backend pakai wallet_id & category_id (integer), bukan string nama
  add: async ({
    wallet_id,
    category_id,
    amount,
    type,
    description,
    transaction_date,
  }) => {
    const response = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        wallet_id,
        category_id,
        amount,
        type,
        description,
        transaction_date,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal tambah transaksi");
    return data;
  },

  // DELETE TRANSACTION
  delete: async (id) => {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Gagal hapus transaksi");
    return data;
  },
};
