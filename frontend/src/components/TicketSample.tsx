import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import '../styling/ConcertTicketSample.css'; // Import the CSS for styling
import { ConcertDetails } from 'types/types';
import { format } from 'date-fns';

const ConcertTicketSample: React.FC<ConcertDetails> = ({ 
  artist, 
  tour, 
  date, 
  venue, 
  seatInfo,
  _id,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, _id, {
        format: 'CODE128',
        width: 2,
        height: 150,
        displayValue: true,
        background: '#f0f0f0',
        lineColor: '#333',
        margin: 0,
      });
    }
  }, []);

  const formatted = format(new Date(date), "EEE MMM d yyyy").toUpperCase();

  
  return (
    <div className="ticket-container">
      <div className="ticket">
        <div className="ticket-content">
          <div className="left-section">
            <h2>{artist}</h2>
            <p className="italic">{tour}</p>
            <p className="sm">{formatted}</p>
            <p className="sm">{venue}</p>
          </div>
          <div className="seat-info">
            <p className="sm">{seatInfo}</p>
          </div>
          <div className="barcode-section">
            <div className='barcode-wrapper'>
              <svg
                ref={barcodeRef}
                className="barcode"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertTicketSample;