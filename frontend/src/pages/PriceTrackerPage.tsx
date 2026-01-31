import EventForm from "components/EventForm";
import { useState, useEffect } from "react";
import { EventWatcher } from "types/types";
import "../styling/PriceTrackerPage.css";

const PriceTrackerPage: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [events, setEvents] = useState<EventWatcher[]>([]);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventWatcher>();

  useEffect(() => {
    fetch("http://127.0.0.1:4000/api/eventWatcher/all_events")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setEvents([]);
        }
      })
      .catch((error) => {
        setError(error);
        console.log("error: failed to fetch all events", error);
      });
  }, []);

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };

  const handleAdd = () => {
    setIsEditing(false);
    toggleForm();
  }

  const handleSubmit = (eventDetails: EventWatcher) => {
    toggleForm();
    setEvents((prevEvent) => {
      if (!prevEvent) return [eventDetails];

      const exists = prevEvent.some((t) => t._id === eventDetails._id);
      if (exists) {
        return prevEvent.map((t) =>
          t._id === eventDetails._id ? eventDetails : t
        );
      } else {
        return [...prevEvent, eventDetails];
      }
    });
  };

  const handleDelete = async (eventId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete the selected event?"
    );

    if (confirm) {
      try {
        const res = await fetch(
          `http://127.0.0.1:4000/api/eventWatcher/event/${eventId}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          setEvents((prev) => prev.filter((event) => event._id !== eventId));
        } else {
          console.error(`Failed to delete event with id ${eventId}`);
        }
      } catch (err) {
        console.error("Network error during deletion:", err);
      }
    }
  };

  const handleEdit = async (eventId: string) => {
    setIsFormVisible(true);
    setIsEditing(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:4000/api/eventWatcher/event/${eventId}`,
        {
          method: "GET",
        }
      );
      const data = await res.json(); // {access_token, refresh_token, expires_in}
      console.log("grabbing event to edit", data);
      setEventToEdit(data);
    } catch (error) {
      console.error("unable to fetch event watcher:", error);
    }
  };

  const getTrackedEvents = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/ticketSite/trackedEvents`,
        {
          method: 'GET',
        }
      )
      const data = await res.json()
      console.log(data)
    } catch (error) {
      console.error('unable to fetch all tracked events:', error)
    }
  }

  const updateTrackingInfo = async (platform: string, eventUrl: string) => {
    console.log('updating tracking info for', platform, eventUrl)
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/ticketSite/eventByUrl?platform=${platform}&eventUrl=${eventUrl}`, {
        method: 'GET'
      })
      const data = await res.json()
      console.log(data)
    } catch (error) {
      console.error('unable to update tracking info')
    }
  }

  return (
    <div className="tracker-page-container">
      <button onClick={getTrackedEvents}>get tracked events</button>
      {isFormVisible && (
        <EventForm
          onSubmit={handleSubmit}
          onCancel={toggleForm}
          onDelete={handleDelete}
          isEditing={isEditing}
          initialData={eventToEdit}
        />
      )}

      <div className="header">
        <h1 className="page-title">my events</h1>
        <button className="add-event-button" onClick={handleAdd}>
          +
        </button>
      </div>
      {events.length ? (
        <div className="events-container">
          <table className="event-table">
            <thead>
              <tr>
                <th>event name</th>
                <th>max price</th>
                <th>quantity</th>
                <th>last price found</th>
                <th>actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id}>
                  <td>
                    <a
                      href={event.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {event.eventName}
                    </a>
                  </td>
                  <td className="price">{event.maxPricePerTicket}</td>
                  <td className="quantity">{event.numTickets}</td>
                  <td className="preferred-sections">
                    {event.preferredSections &&
                    event.preferredSections.length > 0 ? (
                      <>
                        {event.preferredSections.map((section, i) => (
                          <ul className="individual-section-price" key={i}>
                            {section.sectionName} -{" "}
                            {section.lastNotifiedPrice != null
                              ? `$${section.lastNotifiedPrice.toFixed(2)}`
                              : "n/a"}
                          </ul>
                        ))}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <div
                        className="event-edit-button"
                        onClick={() => handleEdit(event._id)}
                      >
                        <img className="icon" src="/edit.png" />
                      </div>
                      <div onClick={() => handleDelete(event._id)}>
                        <img className="icon" src="/trash-can.png" />
                      </div>
                      <div onClick={() => updateTrackingInfo(event.platform, event.eventUrl)}>update</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>add an event to start tracking</div>
      )}
    </div>
  );
};

export default PriceTrackerPage;
