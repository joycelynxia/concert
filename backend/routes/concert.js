const express = require("express");
const router = express.Router();
const multer = require("multer");

const ConcertTicket = require("../models/ConcertTicket");
const ConcertExperience = require("../models/ConcertExperience");
const ConcertMemory = require("../models/ConcertMemory");

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10000000 },
  fileFilter: (req, file, cb) => {
    cb(null, ["image", "video"].includes(file.mimetype.split("/")[0]));
  },
});

const formatYoutubePlaylist = (input) => {
  if (!input || typeof input !== "string") return input;
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return trimmed;
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
      youtubePlaylist,
      priceCents,
      genre,
    } = req.body;

    const newTicket = new ConcertTicket({
      artist,
      tour,
      date,
      venue,
      seatInfo,
      section,
      youtubePlaylist: formatYoutubePlaylist(youtubePlaylist) || undefined,
      priceCents,
      genre,
    });

    await newTicket.save();
    console.log(newTicket._id); // ✅ Access the ID here
    // Automatically create a blank ConcertExperience (you can later let the user edit it)
    const newExperience = new ConcertExperience({
      concertTicket: newTicket._id,
      rating: null, // Optional
      memories: [],
      // Omit userId/sharedWith if local-only
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

    const {
      artist,
      tour,
      date,
      venue,
      seatInfo,
      section,
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

// PUT /api/concerts/:id/playlist
router.put("/:id/playlist", async (req, res) => {
  const { id } = req.params;
  const { setlist } = req.body;
  console.log(`adding playlist to concert ${id}`);

  const parsedId = formatSpotifyPlaylist(setlist);

  if (!parsedId) {
    return res.status(400).json({ error: "Invalid Spotify playlist input" });
  }

  try {
    // const experience = await ConcertExperience.findOne({ concertTicket: id });
    // if (!experience)
    //   return res.status(404).json({ error: "Concert experience not found" });
    // experience.setlist = parsedId;
    // await experience.save();

    const ticket = await ConcertTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.setlist = parsedId;
    await ticket.save();
    res.json(ticket);
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
