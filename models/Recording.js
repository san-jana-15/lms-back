import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Recording", recordingSchema);
