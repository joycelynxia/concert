import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import "../styling/ConcertTicket.css"; // Import the CSS for styling
import { ConcertDetails } from "types/types";
import { format } from "date-fns";

type ConcertTicketProps = ConcertDetails & {
  handleEditButton: (concertDetails: ConcertDetails) => void;
  handleViewDetailsButton: (id: string) => void;

};
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
    handleEditButton,
    handleViewDetailsButton,
  } = props;
  const barcodeRef = useRef<SVGSVGElement>(null);

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
  }, []);

  const formatted = format(new Date(date), "EEE MMM d yyyy").toUpperCase();

  return (
    <div className="ticket">
      <div className="ticket-header">
        <div className="ticket-venue">{venue}</div>
        <div className="ticket-artist">{artist}</div>
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
        <div className="other-buttons">
          <button
            onClick={() =>
              handleEditButton({
                artist,
                tour,
                date,
                venue,
                seatInfo,
                section,
                priceCents,
                genre,
                _id,
              })
            }
          >
            edit
          </button>
          <button>share</button>
          <button onClick={()=>handleViewDetailsButton(_id)}>view details</button>
        </div>
      </div>
    </div>
  );
};

export default ConcertTicket;
