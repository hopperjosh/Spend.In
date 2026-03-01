const BASE_URL = "http://localhost:3000";

// =============================
// 🔐 AUTH API
// =============================
export const authAPI = {
  // REGISTER
  register: async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Register gagal");
    }

    return data;
  },

  // LOGIN
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login gagal");
    }

    // simpan token
    localStorage.setItem("token", data.token);

    return data;
  },

  // GET PROFILE
  getProfile: async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unauthorized");
    }

    return data;
  },
};

// =============================
// 💸 TRANSACTION API
// =============================
export const transactionAPI = {
  // GET ALL TRANSACTIONS
  getAll: async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal ambil transaksi");
    }

    return data;
  },

  // GET SUMMARY (saldo + total expense + investment)
  getSummary: async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/transactions/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal ambil summary");
    }

    return data;
  },

  // ADD TRANSACTION (buat nanti di fitur B)
  add: async (transaction) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transaction),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal tambah transaksi");
    }

    return data;
  },
};
