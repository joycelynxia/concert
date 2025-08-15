import React, { useEffect, useState } from "react";
import { ConcertDetails, EventWatcher } from "types/types";
import "../styling/EventForm.css";

interface EventFormProps {
  onSubmit: (eventDetails: EventWatcher) => void;
  onCancel?: () => void;
  onDelete: (eventId: string) => void;
  isEditing: boolean;
  initialData?: EventWatcher;
}

const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  onCancel,
  onDelete,
  isEditing,
  initialData,
}) => {
  const [eventDetails, setEventDetails] = useState<EventWatcher>({
    email: "",
    eventName: "",
    eventUrl: "",
    preferredSections: [],
    maxPricePerTicket: 0,
    numTickets: 0,
    createdAt: new Date(),
    _id: "",
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setEventDetails(initialData);
    }
  }, [isEditing, initialData]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEventDetails({ ...eventDetails, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("editing?", isEditing);
    console.log("event details:", eventDetails);
    try {
      console.log("event details:", JSON.stringify(eventDetails));

      const url = isEditing
        ? `http://127.0.0.1:4000/api/eventWatcher/event/${eventDetails._id}`
        : `http://127.0.0.1:4000/api/eventWatcher/event`;

      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDetails),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        console.log("response data:", data);

        console.log("event watcher saved:", data.eventWatcher);
        // const ticketWithId = { ...concertDetails, id: data.concert._id };
        onSubmit(data.eventWatcher); // Pass concert details to parent component
      } else {
        console.error("error:", data.message);
      }
    } catch (error) {
      console.error("network error:", error);
    }
  };
  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>{isEditing ? "Edit Event Details" : "Add Event"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email:
            <input
              type="text"
              name="email"
              value={eventDetails.email}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Event Name:
            <input
              type="text"
              name="eventName"
              value={eventDetails.eventName}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Event Url:
            <input
              type="text"
              name="eventUrl"
              value={eventDetails.eventUrl}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Preferred Sections
            <input
              type="text"
              name="preferredSections"
              value={eventDetails.preferredSections
                .map((s) => s.sectionName)
                .join(",")}
              onChange={(e) =>
                setEventDetails({
                  ...eventDetails,
                  preferredSections: e.target.value
                    .split(",")
                    .map((section) => ({
                      sectionName: section.trim(),
                      lastNotifiedPrice: undefined,
                    })),
                })
              }
              required
            />
          </label>
          <label>
            Max Ticket Price
            <input
              type="number"
              name="maxPricePerTicket"
              value={eventDetails.maxPricePerTicket}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Number of Tickets
            <input
              type="number"
              name="numTickets"
              value={eventDetails.numTickets}
              onChange={handleInputChange}
              required
            />
          </label>
          <div className="form-buttons">
            {/* {isEditing ? (
              <button type="button" onClick={() => onDelete(eventDetails._id)}>
                delete
              </button>
            ) : 
            (
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
            )} */}
            <button type="button" onClick={onCancel}>
                cancel
              </button>
            <button type="submit">{isEditing ? "save" : "add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
