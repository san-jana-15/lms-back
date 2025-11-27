import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  subject: String,
  date: String,
  time: String,

  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },

  tutorStatus: {
    type: String,
    enum: ["scheduled", "accepted", "declined"],
    default: "scheduled",
  },

  studentNotified: { type: Boolean, default: false },

  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid"], default: "paid" },

  recording: { type: mongoose.Schema.Types.ObjectId, ref: "Recording" }
},
{ timestamps: true }   // ✅ ADD THIS
);


export default mongoose.model("Booking", bookingSchema);
