import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TicketsPage from './pages/TicketsPage';
import CalendarPage from './pages/CalendarPage';
import MainLayout from './components/MainLayout';
import ConcertExpPage from './pages/ConcertExpPage';

import { SpotifyLogin } from './components/Spotify/SpotifyLogin';
import { SpotifyCallback } from './components/Spotify/SpotifyCallback';
import { SpotifyPlayer } from './components/Spotify/SpotifyPlayer';

import { SpotifyProvider, useSpotify } from './context/SpotifyContext';
import { SpotifyPlayerWrapper } from 'components/Spotify/SpotifyPlayerWrapper';
import { SpotifyCallbackWrapper } from 'components/Spotify/SpotifyCallbackWrapper';
import PriceTrackerPage from 'pages/PriceTrackerPage';

const App: React.FC = () => {
  return (
    <SpotifyProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<TicketsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/concert/:id" element={<ConcertExpPage />} />
            <Route path="/tracker" element={<PriceTrackerPage />} />
            <Route path="/spotify/login" element={<SpotifyLogin />} />
            <Route path="/spotify/callback" element={<SpotifyCallbackWrapper />} />
            <Route path="/spotify/player" element={<SpotifyPlayerWrapper />} />
          </Routes>
        </MainLayout>
      </Router>
    </SpotifyProvider>
  );
};

export default App;
