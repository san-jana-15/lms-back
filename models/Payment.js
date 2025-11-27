import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    recording: { type: mongoose.Schema.Types.ObjectId, ref: "Recording" },

    amount: { type: Number, required: true },

    email: String, // stored for history only

    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
