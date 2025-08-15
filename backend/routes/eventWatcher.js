const express = require("express");
const router = express.Router();

const EventWatcher = require("../models/EventWatcherModel");
const User = require("../models/User");

router.post("/event", async (req, res) => {
  console.log("creating new event tracker");
  try {
    const {
      email,
      eventName,
      preferredSections,
      maxPricePerTicket,
      numTickets,
      createdAt,
      eventUrl,
    } = req.body;

    // Convert string array to object array if necessary
    const formattedSections = preferredSections.map((section) => {
    if (typeof section === "string") {
      return { sectionName: section, lastPriceFound: null };
    }
    return section; // already an object
  });

    const newEventWatcher = new EventWatcher({
      email,
      eventName,
      preferredSections: formattedSections,
      maxPricePerTicket,
      numTickets,
      createdAt,
      eventUrl,
    });
    console.log(newEventWatcher)
    await newEventWatcher.save();

    // const user = await User.findById(userId);
    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }
    // user.currentEventWatchers.push(newEventWatcher._id);
    // await user.save();

    res.status(201).json({
      message: "new event watcher saved successfully",
      eventWatcher: newEventWatcher,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/event/:id", async (req, res) => {
  console.log("editing event watcher");
  try {
    const eventWatcher = await EventWatcher.findById(req.params.id);
    if (!eventWatcher)
      return res.status(404).json({ message: "event watcher not found" });

    const { preferredSections, maxPricePerTicket, numTickets } = req.body;

    if (preferredSections) {
      eventWatcher.preferredSections = preferredSections.map((section) => {
        if (typeof section === "string") {
          return { sectionName: section, lastPriceFound: null };
        }
        return section;
      });
    }

    eventWatcher.maxPricePerTicket = updateField(
      eventWatcher.maxPricePerTicket,
      maxPricePerTicket
    );
    eventWatcher.numTickets = updateField(eventWatcher.numTickets, numTickets);

    const updatedEvent = await eventWatcher.save();
    res.json({
      message: "event watcher updated successfully",
      eventWatcher: updatedEvent,
    });
  } catch (error) {
    console.error("error updating event watcher", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/event/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const eventToDelete = await EventWatcher.findById(id);
    if (!eventToDelete)
      return res.status(404).json({ message: "event watcher not found" });

    // const user = await User.findById(userId);
    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    // user.currentEventWatchers.pull(eventWatcherId);
    // await user.save();

    await EventWatcher.findByIdAndDelete(id);

    res.status(200).json({ message: "event watcher deleted successfully" });
  } catch (error) {
    console.error("Error deleting event watcher:", error);
    res.status(500).json({ error: error.message });
  }
});

function updateField(oldValue, newValue) {
  if (newValue === undefined || newValue === "") {
    return oldValue;
  }
  return newValue;
}

// router.get("/:userId/eventWatcher", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);

//   }
// });

// only allow for one user (LOCAL) for now
router.get("/all_events", async (req, res) => {
  try {
    const events = await EventWatcher.find();
    console.log(events[0]._id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/event/:id", async (req, res) => {
  try {
    const event = await EventWatcher.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "event watcher not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
