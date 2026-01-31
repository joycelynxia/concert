const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const querystring = require("querystring");
const express = require("express");
const router = express.Router();
require("dotenv").config();

const User = require("../models/User");
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "user-read-private",
  "user-read-email",
];

// Email/password signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
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
    res.status(500).json({ message: "Failed to create account" });
  }
});

// Email/password login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
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
});

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

// Spotify OAuth - GET login redirects to Spotify
router.get("/login", (req, res) => {
  console.log("logging in");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scopes.join(" "),
    redirect_uri: REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // TODO: Save tokens in DB or session here

    // For now, send tokens as JSON (you can customize this)
    res.redirect(
      `http://127.0.0.1:3000/spotify/callback?access_token=${access_token}&refresh_token=${refresh_token}`
    );
  } catch (err) {
    console.error(
      "Error exchanging code for token:",
      err.response?.data || err.message
    );
    res.status(500).send("Failed to authenticate");
  }
});

// Example backend route (Node + Express)
router.post("/refresh_token", async (req, res) => {
  const refreshToken = req.body.refresh_token;
  if (!refreshToken) {
    return res.status(400).json({ error: "Missing refresh_token" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json(tokenResponse.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to refresh token");
  }
});

module.exports = router;
