import express from "express";
import multer from "multer";
import Recording from "../models/Recording.js";
import verifyToken from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/recordings"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });


// GET recordings by tutorId (public)
router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.tutorId) {
      query.tutor = req.query.tutorId;
    }

    const recordings = await Recording.find(query)
      .populate("tutor", "name email")
      .lean();

    res.json(recordings);
  } catch (err) {
    console.error("Recording fetch error:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});



/* UPLOAD recording (tutor only) */
router.post("/upload", verifyToken, upload.single("recording"), async (req, res) => {
  try {
    const { description, price, subject } = req.body;
    if (!price || !subject) return res.status(400).json({ message: "Price and subject are required" });

    const rec = await Recording.create({
      tutor: req.user.id,
      originalFileName: req.file.originalname,
      filePath: `/uploads/recordings/${req.file.filename}`,
      description,
      subject,
      price,
    });

    res.json(rec);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* GET tutor's recordings (tutor only) */
router.get("/tutor", verifyToken, async (req, res) => {
  try {
    const recs = await Recording.find({ tutor: req.user.id }).lean();
    res.json(recs);
  } catch (err) {
    console.error("Tutor recs fetch:", err);
    res.status(500).json({ message: "Failed to load recordings" });
  }
});

/* GET public url for a recording — only if student paid for it OR requester is tutor */
router.get("/:id/url", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id).lean();
    if (!rec) return res.status(404).json({ message: "Not found" });

    // If requester is the tutor, allow
    if (String(rec.tutor) === String(req.user.id)) {
      return res.json({ url: `http://localhost:5000${rec.filePath}` });
    }

    // If student paid for recording (Booking exists)
    const paid = await Booking.findOne({
      studentId: req.user.id,
      recording: rec._id,
      paymentStatus: "paid",
    });

    if (!paid) {
      return res.status(403).json({ message: "You must pay first to watch this recording" });
    }

    res.json({ url: `http://localhost:5000${rec.filePath}` });
  } catch (err) {
    console.error("Get recording url error:", err);
    res.status(500).json({ message: "Failed to load recording URL" });
  }
});

/* DELETE recording (tutor) */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const rec = await Recording.findById(req.params.id);
    if (!rec) return res.status(404).json({ message: "Not found" });
    if (String(rec.tutor) !== String(req.user.id)) return res.status(403).json({ message: "Not allowed" });

    await Recording.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete recording error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
