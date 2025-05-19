import React from 'react';
import { useSpotify } from 'context/SpotifyContext';

export const SpotifyLogoutButton = () => {
  const { setTokens } = useSpotify();

  const handleLogout = () => {
    setTokens(null); // clears context
    localStorage.removeItem('spotify_tokens');
    window.location.href = '/'; // optional: redirect to home
  };

  return <button onClick={handleLogout}>Log out of Spotify</button>;
};
