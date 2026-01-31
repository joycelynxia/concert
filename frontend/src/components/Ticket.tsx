import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import "../styling/ConcertTicket.css"; // Import the CSS for styling
import { ConcertDetails } from "types/types";
import { format } from "date-fns";
import { Navigate, useNavigate } from "react-router-dom";
import TicketForm from "./TicketForm";

interface ConcertTicketProps extends ConcertDetails {
  onDelete: (id: string) => void;
  onSave: (ticket: ConcertDetails) => void;
  existingVenues?: string[];
  existingGenres?: string[];
}
const ConcertTicket: React.FC<ConcertTicketProps> = (props) => {
  const {
    artist,
    date,
    venue,
    tour,
    section,
    seatInfo,
    priceCents,
    genre,
    _id,
    onDelete,
    onSave,
    existingVenues = [],
    existingGenres = [],
  } = props;

  const barcodeRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const ticketForForm = { ...props };

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, artist + date, {
        format: "CODE128",
        width: 2,
        height: 150,
        displayValue: false,
        background: "#f0f0f0",
        lineColor: "#333",
        margin: 0,
      });
    }
  }, [artist, date]);

  const formatted = format(new Date(date), "EEE MMM d yyyy").toUpperCase();

  const handleViewDetails = () => {
    navigate(`/concert/${_id}`);
  };

  const openEditForm = () => setIsEditing(true);
  const closeEditForm = () => setIsEditing(false);

const renderEditForm = () =>
    isEditing ? (
      <TicketForm
        onSave={(updatedTicket) => {
          onSave(updatedTicket);
          closeEditForm();
        }}
        onDelete={(id) => {
          onDelete(id);
          closeEditForm();
        }}
        onCancel={closeEditForm}
        isEditing={true}
        initialData={props}
        existingVenues={existingVenues}
        existingGenres={existingGenres}
      />
    ) : null;
  return (
    <>
   {renderEditForm()}
      <div className="ticket" onClick={handleViewDetails} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleViewDetails(); } }}>
        <div className="ticket-header">
          <div className="ticket-venue">{venue}</div>
          <div className="ticket-artist">
            {artist}: {tour}
          </div>
          <div className="ticket-date">{formatted}</div>
        </div>
        <div className="ticket-body">
          <div className="ticket-details">
            <div className="detail-item">
              <div className="ticket-label">section</div>
              <div className="ticket-value">{section || "-"}</div>
            </div>
            <div className="detail-item">
              <div className="ticket-label">seat</div>
              <div className="ticket-value">{seatInfo || "-"}</div>
            </div>{" "}
            <div className="detail-item">
              <div className="ticket-label">price</div>
              <div className="ticket-value">{priceCents || "-"}</div>
            </div>{" "}
            <div className="detail-item">
              <div className="ticket-label">genre</div>
              <div className="ticket-value">{genre || "-"}</div>
            </div>
          </div>
          <div className="entry-details">
            <div className="num-songs"></div>
            <div className="num-photos"></div>
            <div className="has-entry"></div>
          </div>
          <div className="other-buttons" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setIsEditing(true)}>edit</button>
            <button type="button">share</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConcertTicket;
