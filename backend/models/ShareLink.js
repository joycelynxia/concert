const mongoose = require("mongoose");

const ShareLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    ticketIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ConcertTicket" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShareLink", ShareLinkSchema);
