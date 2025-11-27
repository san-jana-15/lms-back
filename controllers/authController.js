// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    console.log("📥 [Register] body:", JSON.stringify(req.body));

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      console.log("⚠️ [Register] validation failed - missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    // verify DB connection quick sanity
    if (mongooseConnectionUnavailable()) {
      console.log("⚠️ [Register] mongoose not connected");
      return res.status(503).json({ message: "Database not connected" });
    }

    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      console.log("⚠️ [Register] email already exists:", email);
      return res.status(409).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: role || "student",
    });

    await newUser.save();

    console.log("✅ [Register] saved user:", newUser._id);
    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ [Register] error:", err && (err.stack || err.message || err));
    return res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    console.log("📥 [Login] body:", JSON.stringify(req.body));
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("⚠️ [Login] validation failed - missing fields");
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (mongooseConnectionUnavailable()) {
      console.log("⚠️ [Login] mongoose not connected");
      return res.status(503).json({ message: "Database not connected" });
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
      console.log("⚠️ [Login] user not found:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log("⚠️ [Login] wrong password for:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      console.log("⚠️ [Login] JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET missing" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("✅ [Login] success:", email);
    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("❌ [Login] error:", err && (err.stack || err.message || err));
    return res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};


import mongoose from "mongoose";
function mongooseConnectionUnavailable() {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  try {
    return !mongoose || mongoose.connection.readyState !== 1;
  } catch {
    return true;
  }
}
