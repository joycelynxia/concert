// ConcertCalendar.tsx
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styling/CalendarPage.css'; // your custom styles
import { format } from 'date-fns';
import { ConcertDetails } from 'types/types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const CalendarPage: React.FC = () => {
  const [concerts, setConcerts] = useState<ConcertDetails[]>([])
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
      fetch('http://127.0.0.1:4000/api/concerts/all_tickets')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConcerts(data);
          } else {
            setConcerts([]);
          }
        })
        .catch(error => {
          setError(error);
          console.log('error: failed to fetch all tickets', error);
        });
    }, []);

  const concertsByDate = concerts.reduce((acc, concert) => {
    const dateKey = concert.date.split('T')[0];
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
  
  
  const displayedConcerts = selectedDate
    ? concertsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : concerts.filter(c => new Date(c.date) > new Date());

  return (
    <div className="calendar-container">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={({ date }) => {
          const key = format(date, 'yyyy-MM-dd');
          return concertsByDate[key] ? <div className="dot" /> : null;
        }}
      />

      <div className="concert-list">
        <h3>{selectedDate ? `Concerts on ${format(selectedDate, 'PPP')}` : 'Upcoming Concerts'}</h3>
        {displayedConcerts.length === 0 ? (
          <p>No concerts.</p>
        ) : (
          <ul>
            {displayedConcerts.map(concert => (
              <li key={concert._id}>
                <strong>{concert.artist}</strong> @ {concert.venue} — time
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;