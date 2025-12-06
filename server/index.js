import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import fanDataRoutes from "./modules/FanData/fanData.route.js";
import motorDataRoutes from "./modules/MotorData/motorData.route.js";
import pdfRoutes from "./modules/PDF/pdf.route.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fan-data", fanDataRoutes);
app.use("/api/motor-data", motorDataRoutes);
app.use("/api/pdf", pdfRoutes);

// Serve static files from the React app build directory
const clientBuildPath = path.join(__dirname, "..", "client", "build");
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't match API routes,
// send back the React app's index.html file.
app.use((req, res, next) => {
  // Only serve index.html for GET requests that don't start with /api
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
