require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();

// ================== CONFIG ==================
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ================== ROOT ==================
app.get("/", (req, res) => {
  res.send("🔥 Backend jalan bro");
});

// ================== AUTH MIDDLEWARE ==================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token ga ada bro" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid bro" });
  }
};

// ================== REGISTER ==================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const checkUser = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar bro" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (full_name, email, password) VALUES ($1,$2,$3) RETURNING id, full_name, email",
      [name, email, hashedPassword],
    );

    res.status(201).json({
      message: "Registrasi berhasil 🔥",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Email tidak ditemukan bro" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Password salah bro" });
    }

    const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login berhasil 🔥",
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== PROFILE ==================
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email FROM users WHERE id=$1",
      [req.user.user_id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== CREATE TRANSACTION ==================
app.post("/transactions", authenticateToken, async (req, res) => {
  try {
    let { amount, description, transaction_date, type } = req.body;

    if (!amount || !type) {
      return res.status(400).json({
        message: "Amount dan type wajib diisi bro",
      });
    }

    if (!transaction_date) {
      transaction_date = new Date().toISOString().split("T")[0];
    }

    // ================== CEK WALLET ==================
    let wallet = await pool.query(
      "SELECT id FROM wallets WHERE user_id=$1 LIMIT 1",
      [req.user.user_id],
    );

    // kalau belum ada wallet → buat otomatis
    if (wallet.rows.length === 0) {
      wallet = await pool.query(
        "INSERT INTO wallets (name, user_id) VALUES ($1, $2) RETURNING id",
        ["Main Wallet", req.user.user_id],
      );
    }

    const wallet_id = wallet.rows[0].id;

    // ================== INSERT TRANSACTION ==================
    const result = await pool.query(
      `INSERT INTO transactions 
       (user_id, wallet_id, amount, description, transaction_date, type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        req.user.user_id,
        wallet_id,
        amount,
        description || "",
        transaction_date,
        type,
      ],
    );

    res.status(201).json({
      message: "Transaksi berhasil 🔥",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error("CREATE TRANSACTION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================== GET USER TRANSACTIONS ==================
app.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id=$1 ORDER BY transaction_date DESC",
      [req.user.user_id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET TRANSACTION ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== DELETE TRANSACTION ==================
app.delete("/transactions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, req.user.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaksi ga ketemu bro",
      });
    }

    res.json({ message: "Transaksi berhasil dihapus 🔥" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== UPDATE TRANSACTION ==================
app.put("/transactions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      wallet_id,
      category_id,
      amount,
      type,
      description,
      transaction_date,
    } = req.body;

    const result = await pool.query(
      `UPDATE transactions
       SET wallet_id=$1,
           category_id=$2,
           amount=$3,
           type=$4,
           description=$5,
           transaction_date=$6
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [
        wallet_id || 1,
        category_id || 1,
        amount,
        type,
        description,
        transaction_date,
        id,
        req.user.user_id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaksi ga ketemu bro",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== SUMMARY ==================
app.get("/transactions/summary", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as total_expense
      FROM transactions
      WHERE user_id=$1
      `,
      [req.user.user_id],
    );

    const income = parseFloat(result.rows[0].total_income);
    const expense = parseFloat(result.rows[0].total_expense);

    res.json({
      total_income: income,
      total_expense: expense,
      balance: income - expense,
    });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error bro" });
  }
});

// ================== START SERVER ==================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
