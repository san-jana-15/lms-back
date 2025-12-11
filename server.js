// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

// ESM dirname fix
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------
   Ensure uploads/recordings exists BEFORE routes load
------------------------------------------------------------------ */
const uploadsRoot = path.join(__dirname, "uploads");
const recordingsDir = path.join(uploadsRoot, "recordings");

if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

console.log("📁 Upload folders ready:", recordingsDir);

/* ------------------------------------------------------------------
   Static files
------------------------------------------------------------------ */
app.use("/uploads", express.static(uploadsRoot));

/* ------------------------------------------------------------------
   CORS - robust, env-driven
   - Add FRONTEND_URL or FRONTEND_URLS to your .env
   - FRONTEND_URLS can be a comma-separated list
     e.g. FRONTEND_URLS=http://localhost:5173,https://learningmanagementsystems.netlify.app
------------------------------------------------------------------ */
const envOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = envOrigins
  .split(",")
  .map(u => u.trim())
  .filter(Boolean)
  .map(u => u.replace(/\/$/, "")); // remove trailing slash if present

// Debug print (remove or guard behind NODE_ENV in production)
console.log("Allowed CORS origins:", allowedOrigins);

app.use((req, res, next) => {
  // optional quick debug logging to help diagnose CORS during development
  // console.log("Incoming request origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server requests and tools like Postman (no origin header)
      if (!origin) return callback(null, true);
      const cleaned = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleaned)) return callback(null, true);
      console.warn("CORS blocked origin:", origin);
      return callback(new Error("CORS policy: Origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false, 
  })
);


app.options("/*", cors());



app.use(express.json());
app.use(cookieParser());


const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));


import authRoutes from "./routes/auth.js";
import tutorRoutes from "./routes/tutors.js";
import bookingRoutes from "./routes/bookings.js";
import recordingRoutes from "./routes/recordings.js";
import reviewRoutes from "./routes/reviews.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/adminRoutes.js";
import fakePaymentRoutes from "./routes/fakePayment.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";


app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fake-payment", fakePaymentRoutes);
app.use("/api/availability", availabilityRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
