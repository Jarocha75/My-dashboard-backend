import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  try {
    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "Patko123*",
      database: "my-dashboard",
      port: 3306,
      connectionLimit: 5,
      acquireTimeout: 30000,
    });

    console.log("Attempting to get connection...");
    const conn = await pool.getConnection();
    console.log("✅ Connection successful!");

    const rows = await conn.query("SELECT 1 as val");
    console.log("Query result:", rows);

    conn.release();
    await pool.end();
    console.log("✅ Connection closed successfully");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();
