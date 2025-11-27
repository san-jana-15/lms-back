import express from "express";
import Booking from "../models/Booking.js";
import Availability from "../models/Availability.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE BOOKING */
router.post("/", auth, async (req, res) => {
  try {
    const { tutorId, subject, date, time, amount } = req.body;

    if (!tutorId || !subject || !date || !time || amount == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = await Booking.create({
      studentId: req.user.id,
      tutorId,
      subject,
      date,
      time,
      amount,
      paymentStatus: req.body.paymentStatus || "paid",
      status: "scheduled",
      tutorStatus: "scheduled",   // FIXED — must match schema
    });


    // populate student and tutor (tutor is a User)
    await booking.populate("studentId", "name email");
    await booking.populate("tutorId", "name email");

    res.json(booking);
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

/* GET All Bookings for a Tutor */
router.get("/tutor", auth, async (req, res) => {
  try {
    const tutorId = req.user.id;

    const bookings = await Booking.find({ tutorId })
      .sort({ date: -1, time: 1 })
      .populate("studentId", "name email")
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error("Get tutor bookings error:", err);
    res.status(500).json({ message: "Failed to load bookings" });
  }
});

/* GET Student's Own Bookings */
router.get("/student", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.user.id })
      .sort({ date: -1, time: 1 })
      // make sure tutorId is populated (so frontend can use tutorId._id safely)
      .populate("tutorId", "name email")
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error("Get student bookings error:", err);
    res.status(500).json({ message: "Failed to load bookings" });
  }
});

/* GET TUTOR AVAILABILITY */
router.get("/availability/:tutorId", async (req, res) => {
  try {
    console.log("Fetching availability for tutor:", req.params.tutorId);

    const slots = await Availability.find({
      tutor: req.params.tutorId,
    }).lean();

    console.log("Slots found:", slots);

    res.json(slots);
  } catch (err) {
    console.error("Availability error:", err);
    res.status(500).json({ message: "Failed to load availability" });
  }
});

/* TUTOR ACCEPT / DECLINE */
router.patch("/accept/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.tutorStatus = "accepted";  // tutor response
    booking.status = "scheduled";      // MUST stay scheduled (enum rule)
    booking.studentNotified = false;

    await booking.save();

    res.json({ message: "Booking accepted" });
  } catch (err) {
    console.error("Accept booking error:", err);
    res.status(500).json({ message: "Failed to accept booking" });
  }
});


router.patch("/decline/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.tutorStatus = "declined";
    booking.studentNotified = false;
    await booking.save();

    res.json({ message: "Booking declined" });
  } catch (err) {
    console.error("Decline booking error:", err);
    res.status(500).json({ message: "Failed to decline booking" });
  }
});

/* RESCHEDULE (Student) */
router.patch("/reschedule/:id", auth, async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: "Date & time required" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the student who booked it can reschedule
    if (String(booking.studentId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.date = date;
    booking.time = time;
    booking.status = "scheduled";
    booking.tutorStatus = "scheduled";
    booking.studentNotified = false;

    await booking.save();

    res.json({ message: "Booking rescheduled", booking });
  } catch (err) {
    console.error("Reschedule error:", err);
    res.status(500).json({ message: "Reschedule failed" });
  }
});

/* CANCEL (Student) */
router.patch("/cancel/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.studentId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "cancelled";
    booking.tutorStatus = "declined";
    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
});

/* TUTOR RESCHEDULE */
router.patch("/tutor-reschedule/:id", auth, async (req, res) => {
  try {
    const { date, time } = req.body;

    const booking = await Booking.findById(req.params.id).populate("tutorId", "name email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // booking.tutorId may be ObjectId or populated object.
    const bookingTutorId = booking.tutorId?._id ? String(booking.tutorId._id) : String(booking.tutorId);

    if (bookingTutorId !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.date = date;
    booking.time = time;
    booking.status = "scheduled";
    booking.studentNotified = false;

    await booking.save();

    res.json({ message: "Tutor rescheduled successfully", booking });
  } catch (err) {
    console.error("Tutor reschedule error:", err);
    res.status(500).json({ message: "Tutor reschedule failed" });
  }
});

export default router;
