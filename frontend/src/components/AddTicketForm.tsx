import React, { useState } from 'react';
import { ConcertDetails } from 'types/types';

interface AddTicketFormProps {
    onAddTicket: (concertDetails: ConcertDetails) => void;
    onCancel: () => void;
  }

const AddTicketForm: React.FC<AddTicketFormProps> = ({ onAddTicket, onCancel }) => {
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>({
    artist: '',
    tour: '',
    date: '',
    venue: '',
    seatInfo: '',
    _id: ''
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConcertDetails({ ...concertDetails, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        const response = await fetch('http://127.0.0.1:4000/api/concerts/ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(concertDetails)
        });
        const data = await response.json();
        if (response.ok) {
          console.log('response data:', data);

            console.log('ticket saved:', data.concert)
            const ticketWithId = { ...concertDetails, id: data.concert._id };
            onAddTicket(ticketWithId); // Pass concert details to parent component
        } else {
            console.error('error:', data.message)
        }
    } catch (err) {
        console.error('network error:', err)
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>Add Concert Details</h2>
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
              value={concertDetails.date}
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
              required
            />
          </label>
          <label>
            Seat Info:
            <input
              type="text"
              name="seatInfo"
              value={concertDetails.seatInfo}
              onChange={handleInputChange}
              required
            />
          </label>
          <div className="form-buttons">
            <button type="submit">Add Ticket</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTicketForm;