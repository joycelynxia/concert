import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TicketsPage from './pages/TicketsPage';
import CalendarPage from './pages/CalendarPage';
import MainLayout from './components/MainLayout';
import ConcertExpPage from './pages/ConcertExpPage';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        if (isLoggedIn || !isOnline()) {
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/tickets" element={<TicketsPage />} />
                  <Route path="/tickets/share/:token" element={<TicketsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/concert/:id" element={<ConcertExpPage />} />
                </Routes>
              </MainLayout>
            }
          />
        } else {
          <Route path="/" element={<AuthPage />} />
        }

      </Routes>
    </Router>
  );
};

export default App;
