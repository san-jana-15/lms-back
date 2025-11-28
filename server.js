import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs";

import authRoutes from "./routes/auth.js";
import tutorRoutes from "./routes/tutors.js";
import bookingRoutes from "./routes/bookings.js";
import recordingRoutes from "./routes/recordings.js";
import reviewRoutes from "./routes/reviews.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/adminRoutes.js";
import fakePaymentRoutes from "./routes/fakePayment.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";

dotenv.config();

const app = express();

// ⭐ ESM-compatible __dirname
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------
   ⭐ FIX 1: Render-safe folder creation
------------------------------------------------------------------ */

const uploadsRoot = path.join(__dirname, "uploads");
const recordingsDir = path.join(uploadsRoot, "recordings");

// Create /uploads folder
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot);
}

// Create /uploads/recordings folder
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
  console.log("📁 Auto-created uploads/recordings");
}

/* ------------------------------------------------------------------
   ⭐ FIX 2: Serve uploads folder publicly
------------------------------------------------------------------ */
app.use("/uploads", express.static(uploadsRoot));

/* ------------------------------------------------------------------
   ⭐ CORS 
------------------------------------------------------------------ */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://resplendent-pie-fe14df.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ------------------------------------------------------------------
   Middleware
------------------------------------------------------------------ */
app.use(express.json());
app.use(cookieParser());

/* ------------------------------------------------------------------
   ⭐ MongoDB Connection
------------------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

/* ------------------------------------------------------------------
   Routes
------------------------------------------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fake-payment", fakePaymentRoutes);
app.use("/api/availability", availabilityRoutes);

/* ------------------------------------------------------------------
   Server Start
------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
