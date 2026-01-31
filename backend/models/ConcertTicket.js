// models/ConcertTicket.js
const mongoose = require("mongoose");

const ConcertTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    artist: { type: String, required: true },
    tour: { type: String },
    date: { type: Date, required: true },
    venue: { type: String },
    seatInfo: { type: String },
    section: { type: String },
    setlist: { type: String },
    youtubePlaylist: { type: String },
    genre: { type: String },
    priceCents: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConcertTicket", ConcertTicketSchema);
