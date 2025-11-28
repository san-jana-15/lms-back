// routes/recordings.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Recording from "../models/Recording.js";
import verifyToken from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* ------------------------------------------------------------------
   Use the same uploads path used in server.js
   (This ensures multer writes to the exact folder served statically)
------------------------------------------------------------------ */
const uploadPath = path.join(__dirname, "../uploads/recordings");

/* Ensure folder exists (idempotent) */
try {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("📁 Created uploads/recordings directory from recordings.js");
  }
} catch (err) {
  console.error("Failed to ensure recordings directory:", err);
}

/* Multer storage config */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    // sanitize filename slightly
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

/* Optionally add limits (e.g. 250MB) */
const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
});

/* GET all recordings (optional filter by tutorId) */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.tutorId) filters.tutor = req.query.tutorId;

    const recordings = await Recording.find(filters)
      .populate("tutor", "name email")
      .lean();

    res.json(recordings);
  } catch (err) {
    console.error("❌ Recording fetch error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* UPLOAD recording (tutor only) */
router.post("/upload", verifyToken, upload.single("recording"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { description, subject, price } = req.body;
    if (!subject || !price) return res.status(400).json({ message: "Subject & Price required" });

    // store path that frontend concatenates with API base
    const fileUrl = `/uploads/recordings/${req.file.filename}`;

    const recording = await Recording.create({
      tutor: req.user.id,
      originalFileName: req.file.originalname,
      filePath: fileUrl,
      description,
      subject,
      price,
    });

    res.json({ message: "Uploaded successfully", recording });
  } catch (err) {
    console.error("❌ Upload error:", err);
    // if multer limit exceeded, err may be a MulterError
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large" });
    }
    res.status(500).json({ message: "Upload failed" });
  }
});

/* GET tutor's recordings (tutor only) */
router.get("/tutor", verifyToken, async (req, res) => {
  try {
    const recs = await Recording.find({ tutor: req.user.id }).lean();
    res.json(recs);
  } catch (err) {
    console.error("❌ Tutor recordings error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* GET secure file URL (used if you want server-side checks) */
router.get("/:id/url", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id).lean();
    if (!rec) return res.status(404).json({ message: "Recording not found" });

    if (String(rec.tutor) === String(req.user.id)) {
      return res.json({ url: rec.filePath });
    }

    const paid = await Booking.findOne({
      studentId: req.user.id,
      recording: rec._id,
      paymentStatus: "paid",
    });

    if (!paid) return res.status(403).json({ message: "Please purchase the recording first" });

    res.json({ url: rec.filePath });
  } catch (err) {
    console.error("❌ Secure URL error:", err);
    res.status(500).json({ message: "Failed to load recording URL" });
  }
});

/* DELETE recording (tutor only) */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: "Not found" });

    if (String(rec.tutor) !== String(req.user.id)) return res.status(403).json({ message: "Not allowed" });

    // Use same absolute path to delete file
    const fileLoc = path.join(__dirname, "../", rec.filePath);
    if (fs.existsSync(fileLoc)) {
      try {
        fs.unlinkSync(fileLoc);
      } catch (unlinkErr) {
        console.error("Failed to delete file from disk:", unlinkErr);
      }
    }

    await Recording.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
