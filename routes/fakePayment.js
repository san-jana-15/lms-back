import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import Booking from "../models/Booking.js";
import Recording from "../models/Recording.js";

const router = express.Router();

/* UNIVERSAL FAKE PAYMENT — supports recording payments and tutor session payments */
router.post("/pay", verifyToken, async (req, res) => {
  try {
    const { recordingId, tutorId, amount } = req.body;
    console.log("FAKE PAYMENT BODY:", req.body);

    /* Recording payment: create/upsert Booking with recording reference */
    if (recordingId) {
      const rec = await Recording.findById(recordingId);
      if (!rec) return res.status(404).json({ message: "Recording not found" });

      const booking = await Booking.findOneAndUpdate(
        { studentId: req.user.id, recording: recordingId },
        {
          studentId: req.user.id,
          tutorId: rec.tutor,
          recording: recordingId,
          amount,
          paymentStatus: "paid",
        },
        { new: true, upsert: true }
      );

      return res.json({ success: true, booking });
    }

    /* Tutor session payment: just return success (booking creation happens in Booking API) */
    if (tutorId) {
      return res.json({ success: true, message: "Tutor booking payment successful" });
    }

    return res.status(400).json({ success: false, message: "No valid payment type" });
  } catch (err) {
    console.error("Fake Payment Error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
});

/* GET student's paid recordings: return bookings having recording and paid */
router.get("/paid", verifyToken, async (req, res) => {
  try {
    const paid = await Booking.find({ studentId: req.user.id, paymentStatus: "paid", recording: { $ne: null } }).select("recording").lean();
    res.json(paid || []);
  } catch (err) {
    console.error("Fetch paid error:", err);
    res.status(500).json({ message: "Failed to fetch paid list" });
  }
});

export default router;
