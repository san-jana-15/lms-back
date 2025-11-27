import express from "express";
import TutorProfile from "../models/TutorProfile.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================================
   GET ALL TUTORS (Student dashboard listings)
====================================================== */
router.get("/", async (req, res) => {
  try {
    const tutors = await TutorProfile.find()
      .populate("user", "name email");

    const formatted = tutors.map((t) => ({
      profileId: t._id,
      userId: t.user?._id,
      name: t.user?.name,
      email: t.user?.email,
      headline: t.headline,
      subjects: t.subjects,
      hourlyRate: t.hourlyRate,
      experienceYears: t.experienceYears,
      languages: t.languages,
      avgRating: t.avgRating || 0,
      reviewsCount: t.reviewsCount || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Tutor list error:", err);
    res.status(500).json({ message: "Failed to fetch tutors" });
  }
});

/* ======================================================
   FETCH OWN TUTOR PROFILE
====================================================== */
router.get("/profile/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await TutorProfile.findOne({ user: userId });

    if (!profile) {
      return res.json({
        profile: null,
        isProfileCompleted: false,
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("Fetch tutor profile error:", err);
    res.status(500).json({ message: "Failed to fetch tutor profile" });
  }
});

/* ======================================================
   CHECK IF FIRST-TIME LOGIN
====================================================== */
router.get("/profile-status", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await TutorProfile.findOne({ user: userId });

    if (!profile || !profile.isProfileCompleted) {
      return res.json({ completed: false });
    }

    res.json({ completed: true });
  } catch (err) {
    console.error("Profile status error:", err);
    res.status(500).json({ message: "Failed" });
  }
});

/* ======================================================
   UPDATE / SETUP TUTOR PROFILE
====================================================== */
router.put("/profile/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      headline,
      bio,
      subjects,
      hourlyRate,
      languages,
      experienceYears,
    } = req.body;

    let profile = await TutorProfile.findOne({ user: userId });

    if (!profile) {
      profile = new TutorProfile({
        user: userId,
        headline,
        bio,
        subjects,
        hourlyRate,
        languages,
        experienceYears,
        isProfileCompleted: true,
      });
    } else {
      profile.headline = headline;
      profile.bio = bio;
      profile.subjects = subjects;
      profile.hourlyRate = hourlyRate;
      profile.languages = languages;
      profile.experienceYears = experienceYears;

      profile.isProfileCompleted = true;
    }

    await profile.save();

    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

export default router;
