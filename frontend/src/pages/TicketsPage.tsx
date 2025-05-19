import React, { useState, useEffect } from 'react';
import AddTicketForm from 'components/AddTicketForm';
import ConcertTicketSample from 'components/TicketSample';
import { ConcertDetails } from 'types/types';
import { useNavigate } from 'react-router-dom';
import '../styling/TicketsPage.css';

function TicketsPage() {
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tickets, setTickets] = useState<ConcertDetails[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:4000/api/concerts/all_tickets')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          setTickets([]);
        }
      })
      .catch(error => {
        setError(error);
        console.log('error: failed to fetch all tickets', error);
      });
  }, []);

  const handleAddTicket = (concertDetails: ConcertDetails) => {
    setTickets([...tickets, concertDetails]);
    setIsFormVisible(false);
  };

  const handleTicketClick = (id: string) => {
    navigate(`/concert/${id}`);
  }

  return (
    <div className="tickets-container">
      <h1 className="page-title">My Concerts</h1>

      <button className="add-button" onClick={() => setIsFormVisible(true)}>Add Concert</button>

      {isFormVisible && (
        <div className="form-wrapper">
          <AddTicketForm
            onAddTicket={handleAddTicket}
            onCancel={() => setIsFormVisible(false)}
          />
        </div>
      )}

      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className="ticket-item"
            onClick={() => handleTicketClick(ticket._id)}
          >
            <ConcertTicketSample {...ticket} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TicketsPage;
