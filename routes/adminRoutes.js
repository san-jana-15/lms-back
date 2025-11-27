import express from "express";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";


const router = express.Router();

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Toggle activation
router.put("/toggle/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ONLY update this field — do NOT save entire user object
    const newStatus = !user.isActive;

    await User.findByIdAndUpdate(
      req.params.id,
      { isActive: newStatus },
      { new: true }
    );

    res.json({ message: "User status updated", isActive: newStatus });
  } catch (err) {
    console.error("Toggle error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change role
router.put("/role/:id", verifyToken, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role)
      return res.status(400).json({ message: "Role is required" });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true, runValidators: false }  // 🚀 IMPORTANT
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Role updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Role change error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
