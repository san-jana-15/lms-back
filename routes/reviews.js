// routes/reviews.js
import express from "express";
import Review from "../models/Review.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------
   CREATE REVIEW (Recording or Tutor)
   POST /api/reviews
------------------------------------------------------- */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { tutorId, rating, comment, recordingId } = req.body;

    if (!tutorId || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const review = await Review.create({
      student: req.user.id,
      tutor: tutorId,
      rating,
      comment,
      recording: recordingId || null,
    });

    res.json(review);
  } catch (err) {
    console.error("Review submit error:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
});


/* -------------------------------------------------------
   GET ALL REVIEWS FOR LOGGED-IN TUTOR
   GET /api/reviews/tutor/me
------------------------------------------------------- */
router.get("/tutor/me", verifyToken, async (req, res) => {
  try {
    const tutorId = req.user.id;

    const reviews = await Review.find({ tutor: tutorId })
      .populate("student", "name email")
      .populate("recording", "originalFileName");

    res.json(reviews);
  } catch (err) {
    console.error("Review fetch error:", err);
    res.status(500).json({ message: "Failed to fetch tutor reviews" });
  }
});


/* -------------------------------------------------------
   CHECK IF STUDENT ALREADY REVIEWED A RECORDING
   GET /api/reviews/check?recordingId=xxx
------------------------------------------------------- */
router.get("/check", verifyToken, async (req, res) => {
  try {
    const { recordingId } = req.query;

    if (!recordingId) {
      return res.json({ reviewed: false });
    }

    const existing = await Review.findOne({
      student: req.user.id,
      recording: recordingId,
    });

    res.json({ reviewed: !!existing });
  } catch (err) {
    console.error("Check review error:", err);
    res.status(500).json({ message: "Failed to check review status" });
  }
});

// GET all reviews for a specific tutor
router.get("/tutor/:tutorId", async (req, res) => {
  try {
    const tutorId = req.params.tutorId;

    const reviews = await Review.find({ tutor: tutorId })
      .populate("student", "name email")
      .populate("recording", "originalFileName")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error("Tutor reviews fetch error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


export default router;
