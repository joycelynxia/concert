const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const multer = require("multer");

const ConcertTicket = require("../models/ConcertTicket");
const ConcertExperience = require("../models/ConcertExperience");
const ConcertMemory = require("../models/ConcertMemory");
const ShareLink = require("../models/ShareLink");
const crypto = require("crypto");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10000000 },
  fileFilter: (req, file, cb) => {
    cb(null, ["image", "video"].includes(file.mimetype.split("/tickets")[0]));
  },
});

const formatSpotifyPlaylist = (input) => {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const playlistMatch = trimmed.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) return playlistMatch[1];
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) return trimmed;
  return null;
};

const formatYoutubePlaylist = (input) => {
  if (!input || typeof input !== "string") return input;
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return trimmed;
};

const getUserIdFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(
      authHeader.replace("Bearer ", ""),
      process.env.JWT_SECRET || "concert-journal-secret"
    );
    return decoded.userId || null;
  } catch {
    return null;
  }
};

const requireTicketOwner = async (req, res, ticket) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ message: "Login required" });
  const ticketUserId = ticket.user ? String(ticket.user) : null;
  if (!ticketUserId || ticketUserId !== String(userId)) {
    return res.status(403).json({ message: "You can only edit your own entries" });
  }
  return null;
};

router.post("/ticket", async (req, res) => {
  console.log("POST /ticket hit");
  console.log(req.body); // 👀 log incoming data
  try {
    const {
      artist,
      tour,
      date,
      venue,
      seatInfo,
      section,
      setlist,
      youtubePlaylist,
      priceCents,
      genre,
    } = req.body;

    const userId = getUserIdFromRequest(req);
    const newTicket = new ConcertTicket({
      ...(userId && { user: userId }),
      artist,
      tour,
      date,
      venue,
      seatInfo,
      section,
      setlist: formatSpotifyPlaylist(setlist) || undefined,
      youtubePlaylist: formatYoutubePlaylist(youtubePlaylist) || undefined,
      priceCents,
      genre,
    });

    await newTicket.save();
    console.log(newTicket._id); // ✅ Access the ID here
    // Automatically create a blank ConcertExperience belonging to the user
    const newExperience = new ConcertExperience({
      ...(userId && { userId }),
      concertTicket: newTicket._id,
      rating: null, // Optional
      memories: [],
    });

    await newExperience.save();
    console.log("Experience created:", newExperience._id);
    res.status(201).json({
      message: "Concert ticket saved successfully!",
      concert: newTicket,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/ticket/:id", async (req, res) => {
  console.log("editing ticket");
  try {
    const ticket = await ConcertTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const ownerError = await requireTicketOwner(req, res, ticket);
    if (ownerError) return ownerError;

    const userId = getUserIdFromRequest(req);
    if (userId && !ticket.user) {
      ticket.user = userId;
    }

    const {
      artist,
      tour,
      date,
      venue,
      seatInfo,
      section,
      setlist,
      youtubePlaylist,
      priceCents,
      genre,
    } = req.body;
    ticket.artist = updateField(ticket.artist, artist);
    ticket.tour = updateField(ticket.tour, tour);
    ticket.date = updateField(ticket.date, date);
    ticket.venue = updateField(ticket.venue, venue);
    ticket.seatInfo = updateField(ticket.seatInfo, seatInfo);
    ticket.section = updateField(ticket.section, section);
    ticket.setlist = updateField(
      ticket.setlist,
      setlist ? formatSpotifyPlaylist(setlist) : undefined
    );
    ticket.youtubePlaylist = updateField(
      ticket.youtubePlaylist,
      youtubePlaylist ? formatYoutubePlaylist(youtubePlaylist) : undefined
    );
    ticket.priceCents = updateField(ticket.priceCents, priceCents);
    ticket.genre = updateField(ticket.genre, genre);

    const updatedTicket = await ticket.save();
    res.json({
      message: "ticket updated successfully",
      concert: updatedTicket,
    });
  } catch (error) {
    console.error("error updating ticket", error);
    res.status(500).json({ error: error.message });
  }
});

function updateField(oldValue, newValue) {
  if (newValue === undefined || newValue === "") {
    return oldValue;
  }
  return newValue;
}

router.get("/all_tickets", async (req, res) => {
  console.log("fetching all tickets");
  try {
    const tickets = await ConcertTicket.find();
    console.log(tickets[0]._id);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Returns only tickets belonging to the authenticated user. Requires Authorization header. */
router.get("/my_tickets", async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }
    const tickets = await ConcertTicket.find({ user: userId }).sort({ date: 1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/share", async (req, res) => {
  try {
    const { ticketIds } = req.body;
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ error: "ticketIds array is required" });
    }
    const token = crypto.randomBytes(12).toString("hex");
    const shareLink = new ShareLink({ token, ticketIds });
    await shareLink.save();
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/share/:token", async (req, res) => {
  try {
    const shareLink = await ShareLink.findOne({ token: req.params.token });
    if (!shareLink) {
      return res.status(404).json({ message: "Share link not found or expired" });
    }
    const tickets = await ConcertTicket.find({
      _id: { $in: shareLink.ticketIds },
    }).sort({ date: 1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/ticket/:id", async (req, res) => {
  console.log("getting ticket info");

  try {
    const ticket = await ConcertTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/experience", async (req, res) => {
  try {
    const { userId, ConcertTicket, rating, notes, photos, videos, sharedWith } =
      req.body;
    const experience = await ConcertExperience.create({
      userId,
      concertTicket,
      rating,
      notes,
      photos,
      videos,
      sharedWith,
    });
    res.status(201).json(experience);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/experience/user/:userId", async (req, res) => {
  try {
    const experiences = await ConcertExperience.find({
      userId: req.params.userId,
    }).populate("concertTicket");
    // .populate('sharedWitth', 'username');
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/experience/:id", async (req, res) => {
  try {
    const experience = await ConcertExperience.findById(req.params.id).populate(
      "concertTicket"
    );
    // .populate('sharedWith', 'username')
    if (!experience)
      return res.status(404).json({ message: "experience not found" });
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/concerts/:id/youtube-playlist
router.put("/:id/youtube-playlist", async (req, res) => {
  const { id } = req.params;
  const { youtubePlaylist } = req.body;
  const parsedId = formatYoutubePlaylist(youtubePlaylist);
  try {
    const ticket = await ConcertTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const ownerError = await requireTicketOwner(req, res, ticket);
    if (ownerError) return ownerError;
    ticket.youtubePlaylist = parsedId || undefined;
    await ticket.save();
    res.json({ youtubePlaylist: ticket.youtubePlaylist });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/concerts/:id/playlist (Spotify)
router.put("/:id/playlist", async (req, res) => {
  const { id } = req.params;
  const { setlist } = req.body;
  console.log(`adding playlist to concert ${id}`);

  const parsedId = formatSpotifyPlaylist(setlist);

  if (!parsedId) {
    return res.status(400).json({ error: "Invalid Spotify playlist input" });
  }

  try {
    const ticket = await ConcertTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const ownerError = await requireTicketOwner(req, res, ticket);
    if (ownerError) return ownerError;
    ticket.setlist = parsedId;
    await ticket.save();
    res.json({ setlist: ticket.setlist });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/setlist", async (req, res) => {
  const id = req.params.id;
  console.log("getting setlist for concert ticket", id);
  try {
    const ticket = await ConcertTicket.findById(id);
    console.log("found ticket", ticket);
    if (!ticket)
      return res.status(404).json({ message: "Concert ticket not found" });
    res.json({ setlist: ticket.setlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/ticket/:id", async (req, res) => {
  const id = req.params.id;
  console.log("deleting ticket", id);
  try {
    const ticket = await ConcertTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const ownerError = await requireTicketOwner(req, res, ticket);
    if (ownerError) return ownerError;

    const experience = await ConcertExperience.findOne({ concertTicket: id });
    console.log("found experience:", experience);
    if (!experience)
      return res.status(404).json({ message: "Concert exp not found" });

    if (experience.memories && experience.memories.length > 0) {
      await ConcertMemory.deleteMany({ _id: { $in: experience.memories } });
    }
    await ConcertExperience.findByIdAndDelete(experience._id);
    await ConcertTicket.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Ticket and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
