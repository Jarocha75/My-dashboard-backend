import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.js";
import billingsRoutes from "./routes/billings.js";
import userRoutes from "./routes/user.js";
import searchRoutes from "./routes/search.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Statické servovanie uploadnutých súborov
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_, res) => {
  res.send("OK");
});

app.use("/api/auth", authRoutes);
app.use("/api/billings", billingsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/search", searchRoutes);

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
