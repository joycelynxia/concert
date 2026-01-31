const mongoose = require("mongoose");

const EventWatcherSchema = new mongoose.Schema({
  email: { type: String, required: true },
  eventName: { type: String, required: true },
  platform: { type: String, enum: ["SeatGeek", "Ticketmaster"], required: true },
  preferredSections: [
    {
      sectionName: { type: String, required: true },
      lastCheckedPrice: { type: Number },
      lastNotifiedPrice: { type: Number },
    },
  ],
  maxPricePerTicket: { type: Number, required: true },
  numTickets: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  eventUrl: { type: String, required: true },
  lastCheckedAt: { type: Date },
});

module.exports = mongoose.model("EventWatcher", EventWatcherSchema);
