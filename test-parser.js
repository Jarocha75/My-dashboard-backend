import dotenv from "dotenv";

dotenv.config();

function parseConnectionString(url) {
  console.log("Original URL:", url);

  const matches = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!matches) throw new Error("Invalid DATABASE_URL format");

  const config = {
    user: matches[1],
    password: decodeURIComponent(matches[2]),
    host: matches[3],
    port: parseInt(matches[4]),
    database: matches[5],
  };

  console.log("Parsed config:", config);
  return config;
}

try {
  const config = parseConnectionString(process.env.DATABASE_URL);
  console.log("\n✅ Parsing successful");
} catch (err) {
  console.error("\n❌ Parsing failed:", err);
}
