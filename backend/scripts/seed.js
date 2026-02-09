/**
 * Seed script for dev environment.
 * Creates test user, tickets, experiences, and memories.
 *
 * Run: npm run seed
 * Or:  node scripts/seed.js
 *
 * Safety: Only runs when NODE_ENV=development or --force is passed.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../models/User");
const ConcertTicket = require("../models/ConcertTicket");
const ConcertExperience = require("../models/ConcertExperience");
const ConcertMemory = require("../models/ConcertMemory");
const ShareLink = require("../models/ShareLink");

const DEV_EMAIL = "dev@example.com";
const DEV_PASSWORD = "dev123456";


const ARTISTS = [
  "Taylor Swift",
  "Phoebe Bridgers",
  "Beyoncé",
  "Bad Bunny",
  "The 1975",
  "Lana Del Rey",
  "Drake",
  "Paramore",
];

const VENUES = [
  "Madison Square Garden",
  "Staples Center",
  "Barclays Center",
  "United Center",
  "TD Garden",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2018, 0, 1);
  const end = new Date(2026, 0, 1);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const SAMPLE_NOTES = [
  "Amazing show! Best night of the year.",
  "The setlist was perfect. Highlights: ...",
  "Got there early, great seats.",
  "Met some cool people in the pit.",
  "Sound quality was incredible.",
];

async function seed() {
  const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--force");
  if (!isDev) {
    console.error("Seed only runs in NODE_ENV=development. Use --force to override.");
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  try {
    // 1. Create or find dev user
    let user = await User.findOne({ email: DEV_EMAIL });
    if (!user) {
      const hashed = await bcrypt.hash(DEV_PASSWORD, 10);
      user = await User.create({
        username: "devuser",
        email: DEV_EMAIL,
        password: hashed,
      });
      console.log("Created dev user:", DEV_EMAIL);
    } else {
      console.log("Found existing dev user:", DEV_EMAIL);
    }

    // 2. Clear existing seed data for this user (optional - keep tickets if you want)
    const existingTickets = await ConcertTicket.find({ user: user._id }).lean();
    const ticketIds = existingTickets.map((t) => t._id);
    if (ticketIds.length > 0) {
      const exps = await ConcertExperience.find({ concertTicket: { $in: ticketIds } });
      const expIds = exps.map((e) => e._id);
      await ConcertMemory.deleteMany({ experience: { $in: expIds } });
      await ConcertExperience.deleteMany({ concertTicket: { $in: ticketIds } });
      await ConcertTicket.deleteMany({ user: user._id });
      console.log("Cleared", ticketIds.length, "existing tickets for dev user.");
    }

    // 3. Create tickets
    const tickets = [];
    for (let i = 0; i < 300; i++) {
      const ticket = await ConcertTicket.create({
        user: user._id,
        artist: randomItem(ARTISTS),
        tour: "World Tour",
        date: randomDate(),
        venue: randomItem(VENUES),
        seatInfo: `Section ${Math.ceil(Math.random() * 20)}, Row ${Math.ceil(Math.random() * 30)}`,
        priceCents: Math.floor(Math.random() * 200) + 50,
      });
      tickets.push(ticket);
    }
    console.log("Created 300 tickets.");

    // 4. Create experiences and memories
    for (let i = 0; i < 300; i++) {
      const ticket = tickets[i];
      const exp = await ConcertExperience.create({
        userId: user._id,
        concertTicket: ticket._id,
        rating: 7 + (i % 3),
      });
      const memory = await ConcertMemory.create({
        experience: exp._id,
        type: "note",
        content: SAMPLE_NOTES[i % SAMPLE_NOTES.length],
      });
      // Update experience to include memory ID in memories array
      exp.memories.push(memory._id);
      await exp.save();
    }
    console.log("Created experiences and notes.");

    // 5. Create a share link for first 2 tickets
    const shareToken = crypto.randomBytes(16).toString("hex");
    await ShareLink.create({
      token: shareToken,
      ticketIds: [tickets[0]._id, tickets[1]._id],
    });
    console.log("Created share link. Token:", shareToken);
    console.log("  Share URL: /tickets/share/" + shareToken);

    console.log("\nSeed complete. Dev login: " + DEV_EMAIL + " / " + DEV_PASSWORD);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seed();
