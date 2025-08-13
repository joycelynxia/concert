import React, { useState, useEffect } from "react";
import TicketForm from "components/TicketForm";
import ConcertTicket from "components/Ticket";
import { ConcertDetails } from "types/types";
import { useNavigate } from "react-router-dom";
import "../styling/TicketsPage.css";
import { SpotifyLogin } from "components/Spotify/SpotifyLogin";

function TicketsPage() {
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tickets, setTickets] = useState<ConcertDetails[]>([]);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:4000/api/concerts/all_tickets")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          setTickets([]);
        }
      })
      .catch((error) => {
        setError(error);
        console.log("error: failed to fetch all tickets", error);
      });
  }, []);

  const handleDeleteTicket = async (ticketId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete the selected concert?"
    );

    if (confirm) {
      try {
        const res = await fetch(
          `http://127.0.0.1:4000/api/concerts/ticket/${ticketId}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          setTickets((prev) =>
            prev.filter((ticket) => ticket._id !== ticketId)
          );
        } else {
          console.error(`Failed to delete ticket with id ${ticketId}`);
        }
      } catch (err) {
        console.error("Network error during deletion:", err);
      }
    }

    // try {
    //   const refreshed = await fetch(
    //     "http://127.0.0.1:4000/api/concerts/all_tickets"
    //   );
    //   const updatedTickets = await refreshed.json();
    //   setTickets(Array.isArray(updatedTickets) ? updatedTickets : []);
    // } catch (err) {
    //   console.error("Failed to refresh tickets list after deletion", err);
    // }
    // }
  };

  const handleSaveTicket = (updatedConcert: ConcertDetails) => {
    console.log('in tickets page')
    setIsFormVisible(false);
    console.log(updatedConcert)

    setTickets((prevTickets) => {
      if (!prevTickets) return [updatedConcert];

      const exists = prevTickets.some((t) => t._id === updatedConcert._id);
      if (exists) {
        return prevTickets.map((t) =>
          t._id === updatedConcert._id ? updatedConcert : t
        );
      } else {
        return [...prevTickets, updatedConcert];
      }
    });
  };

  const onToggleForm = () => {
    setIsFormVisible(!isFormVisible);
  }

  return (
    <>
      <div className="header">
        <SpotifyLogin />
        <h1 className="page-title">my concerts</h1>
        <button
          className="add-ticket-button"
          id="add"
          onClick={onToggleForm}
        >
          +
        </button>
        {isFormVisible && (
          <div className="form-overlay" onClick={() => setIsFormVisible(false)}>
            <div
              className="form-container"
              onClick={(e) => e.stopPropagation()}
            >
              <TicketForm
                onSave={handleSaveTicket}
                onCancel={() => setIsFormVisible(false)}
                onDelete={handleDeleteTicket}
                isEditing={false}
              />
            </div>
          </div>
        )}
      </div>

      <div className="tickets-container">
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
            >
              <ConcertTicket {...ticket} onDelete={handleDeleteTicket} onSave={handleSaveTicket}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default TicketsPage;
