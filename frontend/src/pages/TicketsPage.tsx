import { useState, useEffect, useMemo, useRef } from "react";
import TicketForm from "components/TicketForm";
import ConcertTicket from "components/Ticket";
import { ConcertDetails } from "types/types";
import { useNavigate, useParams } from "react-router-dom";
import { LayoutGrid, List, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { API_BASE } from "../config/api";
import "../styling/TicketsPage.css";
import { getCurrentUserId } from "utils/userUtils";

type SortOption = "date" | "artist";
type ViewMode = "grid" | "table";

function TicketsPage() {
  const navigate = useNavigate();
  const { token: shareToken } = useParams<{ token?: string }>();
  const isViewOnly = Boolean(shareToken);
  const currentUserId = getCurrentUserId();
  const isLoggedIn = Boolean(currentUserId);
  const [isFormVisible, setIsFormVisible] = useState(false);
  // const [shareCopied, setShareCopied] = useState(false);
  const [tickets, setTickets] = useState<ConcertDetails[]>([]);
  // const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVenue, setFilterVenue] = useState<string>("");
  const [filterGenre, setFilterGenre] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
        setIsSortOpen(false);
      }
    };
    if (isFilterOpen || isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen, isSortOpen]);

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
    if (isViewOnly && shareToken) {
      fetch(`${API_BASE}/api/concerts/share/${shareToken}`)
        .then((response) => {
          if (!response.ok) throw new Error("Share link not found");
          return response.json();
        })
        .then((data) => {
          setTickets(Array.isArray(data) ? data : []);
        })
        .catch(() => setTickets([]));
    } else if (isLoggedIn) {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      fetch(`${API_BASE}/api/concerts/my_tickets`, { headers })
        .then((response) => response.json())
        .then((data) => {
          setTickets(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          console.log("error: failed to fetch my tickets", error);
          setTickets([]);
        });
    } else {
      setTickets([]);
    }
  }, [isViewOnly, shareToken, isLoggedIn]);

  const handleDeleteTicket = async (ticketId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete the selected concert?"
    );

    if (confirm) {
      try {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem("token");
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${API_BASE}/api/concerts/ticket/${ticketId}`,
          {
            method: "DELETE",
            headers: Object.keys(headers).length ? headers : undefined,
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
  };

  // const createShareLink = async (ticketIds: string[]) => {
  //   const res = await fetch(`${API_BASE}/api/concerts/share`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ ticketIds }),
  //   });
  //   if (!res.ok) throw new Error("Failed to create share link");
  //   const { token } = await res.json();
  //   return `${window.location.origin}/tickets/share/${token}`;
  // };

  // const handleShare = async () => {
  //   const ids = filteredAndSortedTickets.map((t) => t._id);
  //   if (ids.length === 0) {
  //     window.alert("Add at least one concert to share.");
  //     return;
  //   }
  //   try {
  //     const url = await createShareLink(ids);
  //     await navigator.clipboard.writeText(url);
  //     setShareCopied(true);
  //     setTimeout(() => setShareCopied(false), 2500);
  //   } catch (err) {
  //     console.error(err);
  //     window.alert("Could not create share link. Try again.");
  //   }
  // };

  const handleShareTicket = async (ticketId: string) => {
    try {
      const url = `${window.location.origin}/concert/${ticketId}`;
      await navigator.clipboard.writeText(url);
      // setShareCopied(true);
      // setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      console.error(err);
      window.alert("Could not copy link. Try again.");
    }
  };

  return (
    <>
      <div className="header">
        <div className="header-title-row">
          <h1 className="page-title">my concerts</h1>
          {isLoggedIn && !isViewOnly && (
            <button
              type="button"
              className="account-btn account-btn-primary add-ticket-button"
              onClick={onToggleForm}
              aria-label="Add concert"
            >
              +
            </button>
          )}
        </div>
        <div className="toolbar-row" ref={filterPanelRef}>
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
          <div className="filter-button-wrapper">
            <button
              type="button"
              className={`filter-toggle-btn ${isFilterOpen ? "open" : ""} ${filterVenue || filterGenre ? "active" : ""}`}
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsSortOpen(false);
              }}
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
              aria-label="Filter by venue and genre"
              title="Filter"
            >
              <SlidersHorizontal size={18} />
              <span>Filter</span>
              {(filterVenue || filterGenre) && (
                <span className="filter-badge" aria-hidden>
                  {(filterVenue ? 1 : 0) + (filterGenre ? 1 : 0)}
                </span>
              )}
            </button>
            {isFilterOpen && (
              <div className="filter-dropdown" role="dialog" aria-label="Filter options">
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
              </div>
            )}
          </div>
          <div className="filter-button-wrapper">
            <button
              type="button"
              className={`filter-toggle-btn ${isSortOpen ? "open" : ""}`}
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsFilterOpen(false);
              }}
              aria-expanded={isSortOpen}
              aria-haspopup="true"
              aria-label="Sort by"
              title="Sort by"
            >
              <ChevronDown size={18} />
              <span>Sort by {sortBy === "date" ? "Date" : "Artist"}</span>
            </button>
            {isSortOpen && (
              <div className="filter-dropdown" role="dialog" aria-label="Sort options">
                <button
                  type="button"
                  className={`filter-dropdown-option ${sortBy === "date" ? "active" : ""}`}
                  onClick={() => {
                    setSortBy("date");
                    setIsSortOpen(false);
                  }}
                >
                  Date
                </button>
                <button
                  type="button"
                  className={`filter-dropdown-option ${sortBy === "artist" ? "active" : ""}`}
                  onClick={() => {
                    setSortBy("artist");
                    setIsSortOpen(false);
                  }}
                >
                  Artist
                </button>
              </div>
            )}
          </div>
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

      <div className={`tickets-container ${viewMode === "table" ? "table-view" : ""}`}>
        {viewMode === "grid" ? (
            <div className="ticket-list">
            {filteredAndSortedTickets.map((ticket) => {
              const canEdit = isLoggedIn && (ticket.user != null && String(ticket.user) === String(currentUserId));
              return (
                <div key={ticket._id}>
                  <ConcertTicket
                    {...ticket}
                    onDelete={handleDeleteTicket}
                    onSave={handleSaveTicket}
                    onShare={handleShareTicket}
                    existingVenues={uniqueVenues}
                    existingGenres={uniqueGenres}
                    isViewOnly={isViewOnly}
                    canEdit={canEdit}
                  />
                </div>
              );
            })}
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
                      {!isViewOnly && (() => {
                        const canEdit = isLoggedIn && (ticket.user != null && String(ticket.user) === String(currentUserId));
                        return canEdit ? (
                          <>
                            <button
                              type="button"
                              className="account-btn account-btn-outline account-btn-sm table-action-btn"
                              onClick={() => setEditingTicketId(ticket._id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="account-btn account-btn-danger account-btn-sm table-action-btn"
                              onClick={() => handleDeleteTicket(ticket._id)}
                            >
                              Delete
                            </button>
                          </>
                        ) : null;
                      })()}
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
