import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import '../styling/ConcertTicketSample.css'; // Import the CSS for styling
import { ConcertDetails } from 'types/types';

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
      JsBarcode(barcodeRef.current, '123456789012', {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        background: '#f0f0f0',
        lineColor: '#333',
        margin: 10,
      });
    }
  }, []);

  return (
    <div className="ticket-container">
      <div className="ticket">
        <div className="ticket-content">
          <div className="left-section">
            <h2>{artist}</h2>
            <p className="italic">{tour}</p>
            <p className="sm">{date}</p>
            <p className="sm">{venue}</p>
          </div>
          <div className="seat-info">
            <p className="sm">{seatInfo}</p>
          </div>
          <div className="barcode-section">
            <svg
              ref={barcodeRef}
              className="barcode"
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertTicketSample;