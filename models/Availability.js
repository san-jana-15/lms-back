import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: String,
    required: true, // e.g., "Monday"
  },
  startTime: {
    type: String,
    required: true, // "09:00"
  },
  endTime: {
    type: String,
    required: true, // "11:00"
  }
}, { timestamps: true });

export default mongoose.model("Availability", availabilitySchema);
