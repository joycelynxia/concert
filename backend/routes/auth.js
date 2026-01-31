const axios = require("axios");
const querystring = require("querystring");
const express = require("express");
const router = express.Router();
require("dotenv").config();

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
  "playlist-read-private",
  "playlist-read-collaborative",
];

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
