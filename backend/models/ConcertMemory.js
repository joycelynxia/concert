const mongoose = require("mongoose");

const ConcertMemorySchema = new mongoose.Schema({
  experience: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConcertExperience",
    required: true,
  },
  type: { type: String, enum: ["note", "photo", "video"], required: true },
  content: { type: String, required: true }, // text or file path/URL
  mimeType: { type: String }, // Optional: image/jpeg, video/mp4, etc.
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ConcertMemory", ConcertMemorySchema);
