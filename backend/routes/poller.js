const axios = require("axios");

const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;
const SEATGEEK_CLIENT_SECRET = process.env.SEATGEEK_CLIENT_SECRET;

let trackedEvents = {};

// add new event
function trackEvent(platform, eventId, eventUrl) {
  console.log('trackEvent: adding new event', eventUrl)
  if (!trackedEvents[eventId]) {
    trackedEvents[eventId] = { platform, url: eventUrl, prices: [] };
  }
}

async function pollSeatGeek(eventId) {
  console.log('polling seatgeek')
  console.log(`https://api.seatgeek.com/2/events/${eventId}?client_id=${SEATGEEK_CLIENT_ID}`)
  
  try {
    const res = await axios.get(
      `https://api.seatgeek.com/2/events/${eventId}`,
      {
        params: {
          client_id: SEATGEEK_CLIENT_ID,
          client_secret: SEATGEEK_CLIENT_SECRET,
        },
      }
    );
    const event = res.data;
    const price = event.stats.lowest_price;
    const timestamp = new Date().toISOString();

    trackedEvents[eventId].prices.push({ price, timestamp });
    console.log(`seatgeek event ${eventId} price: $${price} at ${timestamp}`);
  } catch (error) {
    console.error("polling error", error.res?.data || error.message);
  }
}

function startPolling(intervalMs = 6000) {
  console.log('start polling', trackedEvents)
  setInterval(() => {
    Object.keys(trackedEvents).forEach((eventId) => {
      if (trackedEvents[eventId].platform === "SeatGeek") {
        console.log('polling seatgeek')
        // pollSeatGeek(eventId);
      }
      // add other platforms later
    });
  }, intervalMs);
}

module.exports = { trackEvent, trackedEvents, startPolling };
