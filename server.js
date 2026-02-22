import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

console.log("🔥 SERVER FIXED VERSION KELOAD");

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Debug cek env kebaca atau nggak
console.log("DATABASE_URL ada?", process.env.DATABASE_URL ? "YES" : "NO");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// TEST ROUTE 1
app.get("/", (req, res) => {
  res.send("Server jalan bro 🔥");
});

// TEST ROUTE 2
app.get("/halo", (req, res) => {
  res.send("HALO BERHASIL 🔥");
});

// TEST ROUTE DB
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Database error bro",
      error: err.message,
    });
  }
});

// 🔥 Auto detect port (biar aman)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
