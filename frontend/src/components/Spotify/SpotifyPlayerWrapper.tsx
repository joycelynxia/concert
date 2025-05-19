import React, { useState } from 'react';
import { useSpotify } from 'context/SpotifyContext';
import { SpotifyLogin } from 'components/Spotify/SpotifyLogin';
import { SpotifyPlayer } from 'components/Spotify/SpotifyPlayer';

export const SpotifyPlayerWrapper: React.FC = () => {
  const { tokens } = useSpotify();
  const [playlistId, setPlaylistId] = useState<string>('');

  if (!tokens) return <SpotifyLogin />;

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Playlist ID (e.g., 37i9dQZF1DXcBWIGoYBM5M)"
        value={playlistId}
        onChange={(e) => setPlaylistId(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%' }}
      />
      {playlistId && (
        <SpotifyPlayer
          accessToken={tokens.access_token}
          playlistId={playlistId}
        />
      )}
    </div>
  );
};
