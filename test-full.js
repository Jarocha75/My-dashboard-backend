import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

function parseConnectionString(url) {
  const matches = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!matches) throw new Error("Invalid DATABASE_URL format");

  return {
    user: matches[1],
    password: decodeURIComponent(matches[2]),
    host: matches[3],
    port: parseInt(matches[4]),
    database: matches[5],
  };
}

async function testConnection() {
  try {
    const config = parseConnectionString(process.env.DATABASE_URL);
    console.log("Parsed config:", config);

    const pool = mariadb.createPool({
      ...config,
      connectionLimit: 5,
      acquireTimeout: 30000,
    });

    console.log("\nAttempting to get connection...");
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
