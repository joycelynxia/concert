import React, { useEffect, useState } from "react";
import { ConcertDetails } from "types/types";
import { API_BASE } from "../config/api";
import "../styling/TicketForm.css";

interface TicketFormProps {
  onSave: (concertDetails: ConcertDetails) => void;
  onCancel?: () => void;
  onDelete: (ticketId: string) => void;
  isEditing: boolean;
  initialData?: ConcertDetails;
  existingVenues?: string[];
  existingGenres?: string[];
}

const TicketForm: React.FC<TicketFormProps> = ({
  onSave,
  onCancel,
  onDelete,
  isEditing,
  initialData,
  existingVenues = [],
  existingGenres = [],
}) => {
  const [submitError, setSubmitError] = useState("");
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
    setSubmitError("");

    try {
      const url = isEditing
        ? `${API_BASE}/api/concerts/ticket/${concertDetails._id}`
        : `${API_BASE}/api/concerts/ticket`;

      const method = isEditing ? "PUT" : "POST";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(concertDetails),
      });

      let data: { concert?: ConcertDetails; message?: string; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        setSubmitError(response.ok ? "Invalid response" : `Server error (${response.status})`);
        return;
      }

      if (response.ok) {
        onSave(data.concert!);
      } else {
        setSubmitError(data.message || data.error || `Request failed (${response.status})`);
      }
    } catch (err) {
      setSubmitError("Unable to connect. Is the server running?");
    }
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // toISOString() returns "YYYY-MM-DDTHH:mm:ss.sssZ"
    // .slice(0,10) extracts just "YYYY-MM-DD"
    return date.toISOString().slice(0, 10);
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>{isEditing ? "Edit Details" : "Add Concert"}</h2>
        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
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
              list="venue-datalist"
              placeholder={existingVenues.length > 0 ? "Choose or type a new venue" : "e.g. Madison Square Garden"}
            />
            <datalist id="venue-datalist">
              {existingVenues.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
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
            Spotify playlist URL:
            <input
              type="text"
              name="setlist"
              placeholder="https://open.spotify.com/playlist/..."
              value={
                concertDetails.setlist
                  ? concertDetails.setlist.includes("spotify.com")
                    ? concertDetails.setlist
                    : `https://open.spotify.com/playlist/${concertDetails.setlist}`
                  : ""
              }
              onChange={handleInputChange}
            />
          </label>
          <label>
            YouTube playlist URL:
            <input
              type="text"
              name="youtubePlaylist"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={
                concertDetails.youtubePlaylist
                  ? concertDetails.youtubePlaylist.includes("youtube.com")
                    ? concertDetails.youtubePlaylist
                    : `https://www.youtube.com/playlist?list=${concertDetails.youtubePlaylist}`
                  : ""
              }
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
              list="genre-datalist"
              placeholder={existingGenres.length > 0 ? "Choose or type a new genre" : "e.g. Rock, Pop"}
            />
            <datalist id="genre-datalist">
              {existingGenres.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
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
          <div className="form-buttons account-form-actions">
            {isEditing ? (
              <button type="button" className="account-btn account-btn-danger" onClick={() => onDelete(concertDetails._id)}>
                Delete
              </button>
            ) : (
              <button type="button" className="account-btn account-btn-outline" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="account-btn account-btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
