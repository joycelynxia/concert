import React, { useState } from 'react';

export const SpotifyEmbed: React.FC = () => {
  const [playlistUrl, setPlaylistUrl] = useState('');

  const getEmbedSrc = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    const id = match?.[1];
    return id ? `https://open.spotify.com/embed/playlist/${id}` : null;
  };

  const embedSrc = getEmbedSrc(playlistUrl);

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Embed Spotify Playlist</h3>
      <input
        type="text"
        placeholder="Paste Spotify playlist URL"
        value={playlistUrl}
        onChange={(e) => setPlaylistUrl(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />
      {embedSrc && (
        <iframe
          title="Spotify Playlist"
          src={embedSrc}
          width="100%"
          height="380"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};
