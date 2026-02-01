const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const querystring = require("querystring");
const express = require("express");
const router = express.Router();
require("dotenv").config();

const User = require("../models/User");

// Health check – confirms auth router is mounted (GET /api/auth)
router.get("/", (req, res) => res.json({ ok: true, message: "auth router loaded" }));

// Normalize email for consistent lookup and storage
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

// Find user by email (case-insensitive so login works regardless of how email was stored)
function findUserByEmail(email) {
  if (!email) return null;
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({ email: new RegExp(`^${escaped}$`, "i") });
}

// Email/password signup
router.post("/signup", async (req, res) => {
  try {
    const { email: rawEmail, password, name } = req.body;
    const email = normalizeEmail(rawEmail);
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username: name }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? "Email already in use" : "Username already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "concert-journal-secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "email";
      return res.status(400).json({
        message: field === "email" ? "Email already in use" : "Username already in use",
      });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message || "Invalid input" });
    }
    res.status(500).json({ message: "Failed to create account" });
  }
});

async function handleLogin(req, res) {
  try {
    const { email: rawEmail, password } = req.body;
    const email = normalizeEmail(rawEmail);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "concert-journal-secret",
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to log in" });
  }
}

// Email/password login (POST /api/auth and POST /api/auth/login)
router.post("/", handleLogin);
router.post("/login", handleLogin);

// Change password - requires authenticated user
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "concert-journal-secret");
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// Delete account - requires authenticated user, deletes user and all their data
router.post("/delete-account", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "concert-journal-secret");
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ConcertTicket = require("../models/ConcertTicket");
    const ConcertExperience = require("../models/ConcertExperience");
    const ConcertMemory = require("../models/ConcertMemory");

    // Delete user's concert experiences (by userId or via their tickets) and cascade to memories
    const userTicketIds = (await ConcertTicket.find({ user: userId })).map((t) => t._id);
    const userExperiences = await ConcertExperience.find({
      $or: [{ userId }, { concertTicket: { $in: userTicketIds } }],
    });
    const experienceIds = userExperiences.map((e) => e._id);

    await ConcertMemory.deleteMany({ experience: { $in: experienceIds } });
    await ConcertExperience.deleteMany({ _id: { $in: experienceIds } });
    await ConcertTicket.deleteMany({ user: userId });

    // Delete user's event watchers (if model exists)
    try {
      const EventWatcher = require("../models/EventWatcherModel");
      if (user.currentEventWatchers?.length) {
        await EventWatcher.deleteMany({ _id: { $in: user.currentEventWatchers } });
      }
    } catch (modelErr) {
      // EventWatcherModel may not exist; continue with user deletion
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

module.exports = router;
