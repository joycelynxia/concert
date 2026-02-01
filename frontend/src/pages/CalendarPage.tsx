import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_BASE } from "../config/api";
import "../styling/CalendarPage.css";
import { format } from "date-fns";
import { ConcertDetails } from "types/types";
import { getCurrentUserId } from "utils/userUtils";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const now = new Date();
now.setHours(0, 0, 0, 0);

const ConcertListItem: React.FC<{ concert: ConcertDetails }> = ({ concert }) => (
  <li key={concert._id}>
    <Link to={`/concert/${concert._id}`} className="concert-link">
      <strong>{concert.artist}</strong>
      {concert.tour && ` — ${concert.tour}`}
      {concert.venue && ` @ ${concert.venue}`}
      <span className="concert-date">
        {format(new Date(concert.date), "MMM d, yyyy")}
      </span>
    </Link>
  </li>
);

const CalendarPage: React.FC = () => {
  const isLoggedIn = Boolean(getCurrentUserId());
  const [concerts, setConcerts] = useState<ConcertDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setConcerts([]);
      return;
    }
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/api/concerts/my_tickets`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setConcerts(Array.isArray(data) ? data : []);
      })
      .catch(() => setConcerts([]));
  }, [isLoggedIn]);

  const concertsByDate = concerts.reduce((acc, concert) => {
    const dateKey = concert.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(concert);
    return acc;
  }, {} as Record<string, ConcertDetails[]>);

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    } else {
      setSelectedDate(null);
    }
  };

  const upcomingConcerts = concerts
    .filter((c) => new Date(c.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastConcerts = concerts
    .filter((c) => new Date(c.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedConcerts = selectedDate
    ? concertsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : null;

  return (
    <div className="calendar-container">
      <Calendar
        locale="en-US"
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={({ date }) => {
          const key = format(date, "yyyy-MM-dd");
          return concertsByDate[key] ? <div className="dot" /> : null;
        }}
      />

      <div className="concert-list">
        {selectedDate ? (
          <>
            <div className="calendar-list-header">
              <h3>Concerts on {format(selectedDate, "PPP")}</h3>
              <button
                type="button"
                className="account-btn account-btn-outline account-btn-sm calendar-list-header-btn"
                onClick={() => setSelectedDate(null)}
              >
                Show upcoming & past
              </button>
            </div>
            {displayedConcerts && displayedConcerts.length > 0 ? (
              <ul>
                {displayedConcerts.map((c) => (
                  <ConcertListItem key={c._id} concert={c} />
                ))}
              </ul>
            ) : (
              <p>No concerts on this date.</p>
            )}
          </>
        ) : (
          <>
            <section className="concert-section">
              <h3>Upcoming</h3>
              {upcomingConcerts.length === 0 ? (
                <p>No upcoming concerts.</p>
              ) : (
                <ul>
                  {upcomingConcerts.map((c) => (
                    <ConcertListItem key={c._id} concert={c} />
                  ))}
                </ul>
              )}
            </section>
            <section className="concert-section">
              <h3>Past</h3>
              {pastConcerts.length === 0 ? (
                <p>No past concerts.</p>
              ) : (
                <ul>
                  {pastConcerts.map((c) => (
                    <ConcertListItem key={c._id} concert={c} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;