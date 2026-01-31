const axios = require("axios");
const express = require("express");
const router = express.Router();
const { trackEvent, trackedEvents } = require("./poller");

const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;
const SEATGEEK_CLIENT_SECRET = process.env.SEATGEEK_CLIENT_SECRET;
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

const getEventId = (platform, eventUrl) => {
  console.log('getting eventId for', platform, eventUrl)
  let eventId;

  if (platform === "SeatGeek") {
    console.log('seatgeek')
    const match = eventUrl.match(/\/concert\/(\d+)(?:\/|\?|$)/);
    console.log('match', match)
    if (!match) {
      return null;
    } else {
      eventId = match[1];
    }
  } else if (platform === "TicketMaster") {
    const urlParts = new URL(eventUrl);
    eventId = urlParts.pathname.split("/").pop();
  }

  return eventId;
};

router.get("/eventByUrl", async (req, res) => {
  console.log('getting event by url')
  try {
    const { platform, eventUrl } = req.query;
    if (!eventUrl) return res.status(400).json({ error: "missing event url" });
    if (!platform) return res.status(400).json({ error: "missing platform" });

    let eventData, eventId, response;

    if (platform === "SeatGeek") {
      console.log('seatgeek')
      eventId = getEventId(platform, eventUrl);
      console.log('event id', eventId)
      if (!eventId)
        return res.status(400).json({ error: "invalid seatgeek url" });
        response = await axios.get(
        `https://api.seatgeek.com/2/events/${eventId}`,
        {
          params: {
            client_id: SEATGEEK_CLIENT_ID,
            client_secret: SEATGEEK_CLIENT_SECRET,
          },
        }
      );
    } else if (platform === "TicketMaster") {
      console.log('ticketmaster')

      eventId = getEventId(platform, eventUrl);
      response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json`,
        {
          params: {
            apikey: TICKETMASTER_API_KEY,
          },
        }
      );
    } else {
      return res.status(400).json({ error: "unsupported platform" });
    }

    eventData = response.data;
    trackEvent(platform, eventId, eventUrl);
    console.log(eventData)
    res.json({ platform, eventData });
  } catch (error) {
    console.error("api error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "failed to fetch events",
      details: error.response?.data || error.message,
    });
  }
});

router.get("/trackedEvents", (req, res) => {
  console.log('getting tracked events', trackedEvents);
  res.json(trackedEvents);
});

module.exports = router;
