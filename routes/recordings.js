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

// ROOT = /opt/render/project/src  (in Render)
// Correct upload location: ROOT/uploads/recordings
const projectRoot = path.resolve(__dirname, "..");
const uploadPath = path.join(projectRoot, "uploads", "recordings");

// Ensure path exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 Created uploads/recordings directory FROM recordings.js");
}

const router = express.Router();

/* ------------------------------------------------------------------
   Multer storage config
------------------------------------------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const clean = file.originalname.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    cb(null, Date.now() + "-" + clean);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

/* ------------------------------------------------------------------
   GET all recordings (public)
------------------------------------------------------------------ */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.tutorId) filter.tutor = req.query.tutorId;

    const recs = await Recording.find(filter)
      .populate("tutor", "name email")
      .lean();

    res.json(recs);
  } catch (err) {
    console.error("❌ Recording fetch error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* ------------------------------------------------------------------
   UPLOAD recording (tutor only)
------------------------------------------------------------------ */
router.post("/upload", verifyToken, upload.single("recording"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const { description, subject, price } = req.body;

    if (!subject || !price)
      return res.status(400).json({ message: "Subject & price required" });

    const fileUrl = `/uploads/recordings/${req.file.filename}`;

    const rec = await Recording.create({
      tutor: req.user.id,
      originalFileName: req.file.originalname,
      filePath: fileUrl,
      description,
      subject,
      price,
    });

    res.json({ message: "Uploaded successfully", recording: rec });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ------------------------------------------------------------------
   GET tutor's recordings
------------------------------------------------------------------ */
router.get("/tutor", verifyToken, async (req, res) => {
  try {
    const recs = await Recording.find({ tutor: req.user.id }).lean();
    res.json(recs);
  } catch (err) {
    console.error("❌ Tutor recordings fetch error:", err);
    res.status(500).json({ message: "Failed to load tutor recordings" });
  }
});

/* ------------------------------------------------------------------
   SECURE VIDEO URL
------------------------------------------------------------------ */
router.get("/:id/url", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id).lean();
    if (!rec) return res.status(404).json({ message: "Recording not found" });

    // Tutor can always access
    if (String(rec.tutor) === String(req.user.id)) {
      return res.json({ url: rec.filePath });
    }

    // Paid student can access
    const paid = await Booking.findOne({
      studentId: req.user.id,
      recording: rec._id,
      paymentStatus: "paid",
    });

    if (!paid)
      return res.status(403).json({ message: "Please purchase this recording" });

    res.json({ url: rec.filePath });
  } catch (err) {
    console.error("❌ Secure URL error:", err);
    res.status(500).json({ message: "Failed to load secure URL" });
  }
});

/* ------------------------------------------------------------------
   DELETE recording (tutor only)
------------------------------------------------------------------ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: "Not found" });

    if (String(rec.tutor) !== String(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    const fileDiskPath = path.join(projectRoot, rec.filePath);
    if (fs.existsSync(fileDiskPath)) {
      fs.unlinkSync(fileDiskPath);
    }

    await Recording.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });

  } catch (err) {
    console.error("❌ Delete recording error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
