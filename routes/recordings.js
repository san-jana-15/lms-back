// recordings.js
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
   Folder path — ALWAYS matches server.js
------------------------------------------------------------------ */
const uploadPath = path.join(__dirname, "../uploads/recordings");

/* ------------------------------------------------------------------
   Multer Config
------------------------------------------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
});

/* GET ALL RECORDINGS */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.tutorId) filters.tutor = req.query.tutorId;

    const recs = await Recording.find(filters)
      .populate("tutor", "name email")
      .lean();

    res.json(recs);
  } catch (err) {
    console.error("❌ Recording fetch error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* UPLOAD RECORDING */
router.post("/upload", verifyToken, upload.single("recording"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { description, subject, price } = req.body;

    if (!subject || !price)
      return res.status(400).json({ message: "Subject & price required" });

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
    res.status(500).json({ message: "Upload failed" });
  }
});

/* GET TUTOR'S RECORDINGS */
router.get("/tutor", verifyToken, async (req, res) => {
  try {
    const data = await Recording.find({ tutor: req.user.id }).lean();
    res.json(data);
  } catch (err) {
    console.error("❌ Tutor recordings error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* SECURE URL (if needed) */
router.get("/:id/url", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id).lean();
    if (!rec) return res.status(404).json({ message: "Not found" });

    if (String(rec.tutor) === String(req.user.id)) {
      return res.json({ url: rec.filePath });
    }

    const paid = await Booking.findOne({
      studentId: req.user.id,
      recording: rec._id,
      paymentStatus: "paid",
    });

    if (!paid) {
      return res.status(403).json({ message: "Please purchase this recording" });
    }

    res.json({ url: rec.filePath });
  } catch (err) {
    console.error("❌ Secure URL error:", err);
    res.status(500).json({ message: "Failed to load URL" });
  }
});

/* DELETE RECORDING */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: "Not found" });

    if (String(rec.tutor) !== String(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    const fileLoc = path.join(__dirname, "../", rec.filePath);

    if (fs.existsSync(fileLoc)) fs.unlinkSync(fileLoc);

    await Recording.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
