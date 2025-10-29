import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fetchUser } from "../middleware/fetchUser.js";
import ConnectionRequest from "../models/ConnectionRequest.js";
import { Chat, Message } from "../models/Message.js";
import { uploadProfile, uploadImages } from "../utils/upload.js";

const router = express.Router();

// ✅ Register with Profile Picture Upload
router.post(
  "/register",
  uploadProfile.single("profilePic"),
  async (req, res) => {
    try {
      const { email, password, ...rest } = req.body;

      // 1️⃣ Check if user already exists
      let existing = await User.findOne({ email });
      if (existing)
        return res.status(400).json({ error: "User already exists" });

      // 2️⃣ Hash the password
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      // 3️⃣ Handle profile picture (if uploaded)
      let profilePic = {};
      if (req.file && req.file.path) {
        profilePic = {
          url: req.file.path,
          isHidden: false,
          allowedUsers: [],
        };
      }

      // 4️⃣ Create user
      const user = new User({
        email,
        password: secPass,
        profilePic,
        ...rest,
      });

      await user.save();

      // 5️⃣ Generate token
      const token = jwt.sign(
        { user: { id: user._id } },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "User registered successfully",
        token,
        user,
      });
    } catch (err) {
      console.error("Register Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  let success = false;
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET);
    success = true;
    res.json({ success, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 👤 Get Particular User by ID
 */
router.get("/:id", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // hide password always

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Check if the requester is the same user or allowed
    const isOwner = user._id.toString() === req.user.id;

    // Hide profile picture if privacy is enabled and viewer isn't allowed
    if (!isOwner && user.profilePic?.isHidden) {
      const allowed = user.profilePic.allowedUsers.some(
        (u) => u.toString() === req.user.id
      );
      if (!allowed) user.profilePic.url = null;
    }

    // Optionally hide email, mobile, etc. for non-owners
    if (!isOwner) {
      user.email = undefined;
      user.mobile = undefined;
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✏️ UPDATE Own Data
 */
router.put("/update", fetchUser, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body }, // ✅ ensures nested objects are updated correctly
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updated,
    });

    // console.log("✅ Updated User:", updated);
  } catch (err) {
    // console.error("❌ Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📸 Upload Profile Picture
 * POST /api/auth/profile
 */
router.post(
  "/profile",
  fetchUser,
  uploadProfile.single("profilePic"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: "User not found" });

      user.profilePic = { url: req.file.path, isHidden: false };
      await user.save();

      res.json({
        msg: "Profile picture uploaded successfully",
        profilePic: user.profilePic,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * 🖼️ Upload Gallery Images (Max 6)
 * POST /api/auth/images
 */
router.post(
  "/images",
  fetchUser,
  uploadImages.array("images", 6),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const urls = req.files.map((file) => file.path);
      user.images.push(...urls);
      if (user.images.length > 6) user.images = user.images.slice(-6); // keep last 6
      await user.save();

      res.json({ msg: "Images uploaded successfully", images: user.images });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * 🗑️ Delete a Specific Gallery Image
 * DELETE /api/upload/image/:index
 */
router.delete("/image/:index", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const index = parseInt(req.params.index);

    console.log(index,"index")

    if (isNaN(index) || index < 0 || index >= user.images.length)
      return res.status(400).json({ msg: "Invalid image index" });

    user.images.splice(index, 1);
    await user.save();

    res.json({ msg: "Image deleted", images: user.images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 👁️ Toggle Picture Visibility (Hide/Show)
 */
router.put("/toggle-picture-privacy", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.profilePic || !user.profilePic.url)
      return res.status(400).json({ msg: "No profile picture found" });

    user.profilePic.isHidden = !user.profilePic.isHidden;
    await user.save();

    res.json({
      msg: `Profile picture is now ${
        user.profilePic.isHidden ? "hidden" : "visible"
      }`,
      profilePic: user.profilePic,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🗑️ DELETE Own Account
 */
router.delete("/delete", fetchUser, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    await ConnectionRequest.deleteMany({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });
    await Chat.deleteMany({ participants: req.user.id });
    await Message.deleteMany({ sender: req.user.id });
    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
