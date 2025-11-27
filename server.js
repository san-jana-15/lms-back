import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";

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

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// ⭐ Serve uploaded files (VIDEOS, IMAGES, ETC.)
app.use("/uploads/recordings", express.static(path.join(process.cwd(), "uploads/recordings")));


// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connection established.");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected.");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fake-payment", fakePaymentRoutes);
app.use("/api/availability", availabilityRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
