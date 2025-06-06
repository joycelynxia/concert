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
  const [ticketsToDelete, setTicketsToDelete] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState(false);

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

  const handleDeleteTicket = async () => {
    if (ticketsToDelete.size === 0) {
      alert("No tickets selected for deletion.");
      return;
    }

    const confirm = window.confirm("Are you sure you want to delete the selected concert(s)?");

    if (confirm) {
      const ids = Array.from(ticketsToDelete);
      for (const id of ids) {
        try {
          const res = await fetch(`http://127.0.0.1:4000/api/concerts/ticket/${id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            setTickets(prev => prev.filter(ticket => ticket._id !== id));
          } else {
            console.error(`Failed to delete ticket with id ${id}`);
          }
        } catch (err) {
          console.error('Network error during deletion:', err);
        }
      }

      try {
        const refreshed = await fetch('http://127.0.0.1:4000/api/concerts/all_tickets');
        const updatedTickets = await refreshed.json();
        setTickets(Array.isArray(updatedTickets) ? updatedTickets : []);
      } catch (err) {
        console.error("Failed to refresh tickets list after deletion", err);
      }

      setEdit(false);
      setTicketsToDelete(new Set());
  }
}

  const handleTicketClick = (id: string) => {
    navigate(`/concert/${id}`);
  }

  const toggleTicketSelection = (id: string) => {
    setTicketsToDelete((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };
  

  return (
    <div className="tickets-container">
      <h1 className="page-title">My Concerts</h1>

      <div className='ticket-button-container'>
        <button className="ticket-button" id="add" onClick={() => setIsFormVisible(true)}>Add</button>
        <button className="ticket-button" id="delete" onClick={() => setEdit(true)}>Delete</button>
      </div>

      {isFormVisible && (
        <div className="form-overlay" onClick={() => setIsFormVisible(false)}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <AddTicketForm
              onAddTicket={handleAddTicket}
              onCancel={() => setIsFormVisible(false)}
            />
          </div>
        </div>
      )}

      {edit && (
        <div className="confirm-delete-container">
          <button
            className="confirm-delete-button"
            onClick={handleDeleteTicket}
          >
            Confirm Delete
          </button>
          <button onClick={() => {
            setEdit(false);
            setTicketsToDelete(new Set());
          }}>Cancel</button>
        </div>
      )}


      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`ticket-item ${edit ? 'deletable' : ''} ${ticketsToDelete.has(ticket._id) ? 'selected' : ''}`}
            onClick={() => edit ? toggleTicketSelection(ticket._id) : handleTicketClick(ticket._id)}
            >
            <ConcertTicketSample {...ticket} />
          </div>
        ))}
      </div>
    </div>
  );
}


export default TicketsPage;
