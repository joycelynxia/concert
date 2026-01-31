import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TicketsPage from './pages/TicketsPage';
import CalendarPage from './pages/CalendarPage';
import MainLayout from './components/MainLayout';
import ConcertExpPage from './pages/ConcertExpPage';
import PriceTrackerPage from 'pages/PriceTrackerPage';

const App: React.FC = () => {
  return (
    <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<TicketsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/concert/:id" element={<ConcertExpPage />} />
            <Route path="/tracker" element={<PriceTrackerPage />} />
          </Routes>
        </MainLayout>
      </Router>
  );
};

export default App;
