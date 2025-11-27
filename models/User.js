import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },

    // NEW FIELDS
    contact: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    occupation: {
      type: String,
      enum: ["Student", "Fresher", "Graduate", "Working Professional", ""],
      default: "",
    },

    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
