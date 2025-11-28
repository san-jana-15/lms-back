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

// ESM dirname setup
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------
   ⭐ INIT UPLOAD FOLDERS BEFORE ROUTES LOAD
------------------------------------------------------------------ */
import { initUploads } from "./initUploads.js";
initUploads();

/* ------------------------------------------------------------------
   ⭐ CORS CONFIG
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
   ⭐ STATIC FILES
------------------------------------------------------------------ */
const uploadsRoot = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsRoot));

/* ------------------------------------------------------------------
   MONGO CONNECTION
------------------------------------------------------------------ */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

/* ------------------------------------------------------------------
   Import routes AFTER upload folders exist
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
   Register Routes
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
app.listen(PORT, () =>
  console.log(`🚀 Server running on https://lms-back-nh5h.onrender.com`)
);
