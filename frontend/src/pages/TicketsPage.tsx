import { useState, useEffect, useMemo } from "react";
import TicketForm from "components/TicketForm";
import ConcertTicket from "components/Ticket";
import { ConcertDetails } from "types/types";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, Search } from "lucide-react";
import { format } from "date-fns";
import "../styling/TicketsPage.css";

type SortOption = "date" | "artist";
type ViewMode = "grid" | "table";

function TicketsPage() {
  const navigate = useNavigate();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tickets, setTickets] = useState<ConcertDetails[]>([]);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVenue, setFilterVenue] = useState<string>("");
  const [filterGenre, setFilterGenre] = useState<string>("");

  const uniqueVenues = useMemo(() => {
    const venues = new Set(
      tickets.map((t) => t.venue?.trim()).filter(Boolean) as string[]
    );
    return Array.from(venues).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tickets]);

  const uniqueGenres = useMemo(() => {
    const genres = new Set(
      tickets.map((t) => t.genre?.trim()).filter(Boolean) as string[]
    );
    return Array.from(genres).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tickets]);

  const filteredAndSortedTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = tickets.filter((ticket) => {
      const matchesSearch =
        !q ||
        (ticket.artist?.toLowerCase().includes(q) ?? false) ||
        (ticket.venue?.toLowerCase().includes(q) ?? false);
      const matchesVenue = !filterVenue || ticket.venue === filterVenue;
      const matchesGenre = !filterGenre || ticket.genre === filterGenre;
      return matchesSearch && matchesVenue && matchesGenre;
    });
    if (sortBy === "date") {
      list = [...list].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } else {
      list = [...list].sort((a, b) =>
        (a.artist || "").localeCompare(b.artist || "", undefined, { sensitivity: "base" })
      );
    }
    return list;
  }, [tickets, searchQuery, filterVenue, filterGenre, sortBy]);

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
        <h1 className="page-title">my concerts</h1>
        <div className="search-and-filters">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Search by artist or venue"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search concerts by artist or venue"
            />
          </div>
          <div className="filters-row">
            <label className="filter-label">
              Venue
              <select
                value={filterVenue}
                onChange={(e) => setFilterVenue(e.target.value)}
                className="filter-select"
                aria-label="Filter by venue"
              >
                <option value="">All venues</option>
                {uniqueVenues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="filter-label">
              Genre
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="filter-select"
                aria-label="Filter by genre"
              >
                <option value="">All genres</option>
                {uniqueGenres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="sort-label">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="sort-select"
              >
                <option value="date">Date</option>
                <option value="artist">Artist</option>
              </select>
            </label>
          </div>
        </div>
        <div className="header-actions">
          <div className="left-actions">
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Grid view"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                title="Table view"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          <div className="right-actions"><button
            className="add-ticket-button"
            id="add"
            onClick={onToggleForm}
          >
            +
          </button></div>
          {(isFormVisible || editingTicketId) && (
            <div
              className="form-overlay"
              onClick={() => {
                setIsFormVisible(false);
                setEditingTicketId(null);
              }}
            >
              <div
                className="form-container"
                onClick={(e) => e.stopPropagation()}
              >
                <TicketForm
                  onSave={(updated) => {
                    handleSaveTicket(updated);
                    setEditingTicketId(null);
                  }}
                  onCancel={() => {
                    setIsFormVisible(false);
                    setEditingTicketId(null);
                  }}
                  onDelete={(id) => {
                    handleDeleteTicket(id);
                    setEditingTicketId(null);
                  }}
                  isEditing={!!editingTicketId}
                  initialData={
                    editingTicketId
                      ? tickets.find((t) => t._id === editingTicketId)
                      : undefined
                  }
                  existingVenues={uniqueVenues}
                  existingGenres={uniqueGenres}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`tickets-container ${viewMode === "table" ? "table-view" : ""}`}>
        {viewMode === "grid" ? (
          <div className="ticket-list">
            {filteredAndSortedTickets.map((ticket) => (
              <div key={ticket._id}>
                <ConcertTicket
                  {...ticket}
                  onDelete={handleDeleteTicket}
                  onSave={handleSaveTicket}
                  existingVenues={uniqueVenues}
                  existingGenres={uniqueGenres}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Artist</th>
                  <th>Tour</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Section</th>
                  <th>Seat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/concert/${ticket._id}`)}
                    className="ticket-table-row"
                  >
                    <td>{ticket.artist}</td>
                    <td>{ticket.tour || "—"}</td>
                    <td>{format(new Date(ticket.date), "MMM d, yyyy")}</td>
                    <td>{ticket.venue || "—"}</td>
                    <td>{ticket.section || "—"}</td>
                    <td>{ticket.seatInfo || "—"}</td>
                    <td className="table-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => setEditingTicketId(ticket._id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        onClick={() => handleDeleteTicket(ticket._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default TicketsPage;
