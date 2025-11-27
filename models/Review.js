import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    recording: { type: mongoose.Schema.Types.ObjectId, ref: "Recording", default: null },

    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },

    reply: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
