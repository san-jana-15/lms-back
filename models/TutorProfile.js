// models/TutorProfile.js
import mongoose from "mongoose";

const TutorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    headline: { type: String, default: "" },
    bio: { type: String, default: "" },

    subjects: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },

    languages: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },

    isProfileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("TutorProfile", TutorProfileSchema);
