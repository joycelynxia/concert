import React from 'react';
import { useSpotify } from 'context/SpotifyContext';
import { SpotifyCallback } from 'components/Spotify/SpotifyCallback';
import { useNavigate } from 'react-router-dom';
import { Tokens } from 'types/spotify';
export const SpotifyCallbackWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens } = useSpotify();

  const handleTokensReceived = (tokens: Tokens) => {
    setTokens(tokens);
    navigate('/')
  }
  return <SpotifyCallback onTokensReceived={handleTokensReceived} />;
};
