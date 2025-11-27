import express from "express";
import Availability from "../models/Availability.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE availability slot (tutor)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = await Availability.create({
      tutor: req.user.id,
      day: req.body.day,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    });
    res.json(data);
  } catch (error) {
    console.error("Availability create error:", error);
    res.status(500).json({ message: "Failed to save availability" });
  }
});

// GET logged-in tutor's availability
router.get("/", authMiddleware, async (req, res) => {
  try {
    const slots = await Availability.find({ tutor: req.user.id }).lean();
    res.json(slots);
  } catch (error) {
    console.error("Availability fetch error:", error);
    res.status(500).json({ message: "Failed to load availability" });
  }
});

// PUBLIC: GET specific tutor availability by ID (for students)
router.get("/:tutorId", async (req, res) => {
  try {
    const slots = await Availability.find({ tutor: req.params.tutorId }).select("day startTime endTime").lean();
    res.json(slots);
  } catch (error) {
    console.error("Availability fetch (public) error:", error);
    res.status(500).json({ message: "Failed to load availability" });
  }
});

// DELETE a slot (tutor)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Availability.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Availability delete error:", error);
    res.status(500).json({ message: "Failed to delete availability" });
  }
});

export default router;
