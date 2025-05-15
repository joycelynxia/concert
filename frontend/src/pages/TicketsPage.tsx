import React, { useState, useEffect } from 'react';
import AddTicketForm from 'components/AddTicketForm'; // Import the form component
import ConcertTicketSample from 'components/TicketSample';
import { ConcertDetails } from 'types/types';
import { useNavigate } from 'react-router-dom';

function TicketsPage() {
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false); // Manage form visibility
  const [tickets, setTickets] = useState<ConcertDetails[]>([]); // Manage list of tickets
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/concerts/all_tickets')
      .then(response => response.json())
      .then(data => {
        console.log('Fetched tickets:', data);
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          console.error('Expected an array but got:', data);
          setTickets([]); // fallback to empty array
        }
      })
      .catch(error => {
        setError(error);
        console.log('error: failed to fetch all tickets', error);
      });
  }, []);
  

  // Function to handle form submission
  const handleAddTicket = (concertDetails: ConcertDetails) => {
    setTickets([...tickets, concertDetails]); // Add new ticket to the list
    setIsFormVisible(false); // Hide the form
  };

  const handleTicketClick = (id: string) => {
    console.log(`clicked on ticket ${id}`)
    navigate(`/concert/${id}`);
  }

  return (
    <div>
      <h1>My Concerts</h1>

      {/* Button to show the form */}
      <button onClick={() => setIsFormVisible(true)}>Add concert</button>

      {/* Conditionally render the form */}
      {isFormVisible && (
        <AddTicketForm
          onAddTicket={handleAddTicket}
          onCancel={() => setIsFormVisible(false)}
        />
      )}

      {/* Render the list of tickets */}
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div key={ticket._id} onClick={() => handleTicketClick(ticket._id)} style={{cursor:'pointer'}}>
          <ConcertTicketSample {...ticket} />
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default TicketsPage;