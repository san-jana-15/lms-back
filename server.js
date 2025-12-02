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
   Serve static files (correct Render path)
------------------------------------------------------------------ */
app.use("/uploads", express.static(uploadsRoot));

/* ------------------------------------------------------------------
   CORS
------------------------------------------------------------------ */
/* --------------------------------------------------------------
   FIXED CORS FOR EXPRESS v5 — MUST COME BEFORE ROUTES
---------------------------------------------------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lms-front-end.netlify.app",  // ✅ correct frontend
      "https://lmsfront.netlify.app",
      "https://resplendent-pie-fe14df.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


/* ------------------------------------------------------------------
   Middleware
------------------------------------------------------------------ */
app.use(express.json());
app.use(cookieParser());

/* ------------------------------------------------------------------
   MongoDB Connection
------------------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
   console.error("❌ Missing MONGO_URI in .env");
   process.exit(1);
}

mongoose
   .connect(MONGO_URI)
   .then(() => console.log("✅ MongoDB connected"))
   .catch((err) => console.error("❌ MongoDB error:", err));

/* ------------------------------------------------------------------
   Import routes AFTER uploads folder exists
------------------------------------------------------------------ */
import authRoutes from "./routes/auth.js";
import tutorRoutes from "./routes/tutors.js";
import bookingRoutes from "./routes/bookings.js";
import recordingRoutes from "./routes/recordings.js";
import reviewRoutes from "./routes/reviews.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/adminRoutes.js";
import fakePaymentRoutes from "./routes/fakePayment.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";

/* ------------------------------------------------------------------
   Register routes
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
   Start Server
------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
});
