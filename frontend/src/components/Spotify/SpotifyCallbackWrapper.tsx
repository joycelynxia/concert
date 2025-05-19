import React from 'react';
import { useSpotify } from 'context/SpotifyContext';
import { SpotifyCallback } from 'components/Spotify/SpotifyCallback';

export const SpotifyCallbackWrapper: React.FC = () => {
  const { setTokens } = useSpotify();
  return <SpotifyCallback onTokensReceived={setTokens} />;
};
