import React, { useEffect, useState } from "react";
import { ConcertDetails } from "types/types";
import "../styling/TicketForm.css";
interface TicketFormProps {
  onSave: (concertDetails: ConcertDetails) => void;
  onCancel?: () => void;
  onDelete: (ticketId: string) => void;
  isEditing: boolean;
  initialData?: ConcertDetails;
}

const TicketForm: React.FC<TicketFormProps> = ({
  onSave,
  onCancel,
  onDelete,
  isEditing,
  initialData,
}) => {
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>({
    artist: "",
    tour: "",
    date: "",
    venue: "",
    seatInfo: "",
    section: "",
    setlist: "",
    youtubePlaylist: "",
    priceCents: 0,
    genre: "",
    _id: "",
  });

  useEffect(() => {
    if (isEditing && initialData) {
      setConcertDetails(initialData);
    }
  }, [isEditing, initialData]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConcertDetails({ ...concertDetails, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log(`editing: ${isEditing} | ${concertDetails._id}`);
      const url = isEditing
        ? `http://127.0.0.1:4000/api/concerts/ticket/${concertDetails._id}`
        : `http://127.0.0.1:4000/api/concerts/ticket`;

      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(concertDetails),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("response data:", data);

        console.log("ticket saved:", data.concert);
        // const ticketWithId = { ...concertDetails, id: data.concert._id };
        onSave(data.concert); // Pass concert details to parent component
      } else {
        console.error("error:", data.message);
      }
    } catch (err) {
      console.error("network error:", err);
    }
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // toISOString() returns "YYYY-MM-DDTHH:mm:ss.sssZ"
    // .slice(0,10) extracts just "YYYY-MM-DD"
    return date.toISOString().slice(0, 10);
  };

  const formatSpotifyPlaylist = (url: string) => {
    const regex = /playlist\/(.+)$/;
    const match = url.match(regex);
    if (match) return match[1];
    return url;
  };

  const formatYoutubePlaylist = (url: string) => {
    const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) return listMatch[1];
    return url;
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>{isEditing ? "Edit Details" : "Add Concert"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Artist:
            <input
              type="text"
              name="artist"
              value={concertDetails.artist}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Tour:
            <input
              type="text"
              name="tour"
              value={concertDetails.tour}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Date:
            <input
              type="date"
              name="date"
              value={formatDateForInput(concertDetails.date)}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Venue:
            <input
              type="text"
              name="venue"
              value={concertDetails.venue}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Seat Info:
            <input
              type="text"
              name="seatInfo"
              value={concertDetails.seatInfo}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Section:
            <input
              type="text"
              name="section"
              value={concertDetails.section}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Setlist (Spotify Playlist URL):
            <input
              type="text"
              name="setlist"
              value={formatSpotifyPlaylist(concertDetails.setlist || "")}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Setlist (YouTube Playlist URL – free):
            <input
              type="text"
              name="youtubePlaylist"
              value={formatYoutubePlaylist(concertDetails.youtubePlaylist || "")}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Genre:
            <input
              type="text"
              name="genre"
              value={concertDetails.genre}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Price:
            <input
              type="number"
              name="priceCents"
              value={concertDetails.priceCents}
              onChange={handleInputChange}
            />
          </label>
          <div className="form-buttons">
            {isEditing ? (
              <button onClick={() => onDelete(concertDetails._id)}>
                Delete
              </button>
            ) : (
              <button onClick={onCancel}>Cancel</button>
            )}
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
