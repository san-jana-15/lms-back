import express from "express";
import Payment from "../models/Payment.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================================
   FAKE PAYMENT ORDER
================================ */
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount required" });
    }

    const fakeOrder = {
      id: "order_" + Date.now(),
      amount: amount * 100,
      currency: "INR",
      status: "created",
    };

    res.json(fakeOrder);
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

/* ================================
   FAKE VERIFY PAYMENT (Save Payment)
================================ */
router.post("/verify", verifyToken, async (req, res) => {
  try {
    console.log("PAYMENT VERIFY BODY:", req.body);
    console.log("USER ID:", req.user?.id);

    const { tutorId, amount, recording, email, type } = req.body;

    const payment = await Payment.create({
      tutor: tutorId,
      student: req.user.id,
      amount,
      email,
      recording: type === "booking" ? null : recording,
      date: new Date(),
      razorpay_order_id: "FAKE",
      razorpay_payment_id: "FAKE",
      razorpay_signature: "FAKE",
    });


    return res.json({ success: true, payment });
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
});



/* ================================
   GET PAYMENTS FOR LOGGED-IN TUTOR
================================ */
router.get("/tutor", verifyToken, async (req, res) => {
  try {
    const tutorId = req.user.id;

    const payments = await Payment.find({ tutor: tutorId }).lean();

    res.json(payments);
  } catch (err) {
    console.error("Tutor payments fetch error:", err);
    res.status(500).json({ message: "Failed to fetch tutor payments" });
  }
});

router.get("/student", verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user.id })
      .populate("tutor", "name")
      .populate("recording", "originalFileName")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error("Student payment fetch error:", err);
    res.status(500).json({ message: "Failed to load payments" });
  }
});




export default router;
