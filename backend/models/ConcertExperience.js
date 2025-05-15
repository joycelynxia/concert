const mongoose = require('mongoose');

const ConcertExperienceSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  concertTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'ConcertTicket', required: true },
  rating: { type: Number, min: 1, max: 10 }, // Optional user rating
  memories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ConcertMemory' }],
  // sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Optional for future features
}, { timestamps: true });

module.exports = mongoose.model('ConcertExperience', ConcertExperienceSchema);
