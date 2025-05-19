import React, { useEffect, useState } from 'react';

interface Track {
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
}

interface PlaylistTracksProps {
  accessToken: string;
  playlistId: string; // Just the ID, not the full URL
}

export const PlaylistTracks: React.FC<PlaylistTracksProps> = ({ accessToken, playlistId }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !playlistId) return;

    async function fetchTracks() {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);

        const data = await res.json();

        const extractedTracks = data.tracks.items.map((item: any) => ({
          name: item.track.name,
          uri: item.track.uri,
          artists: item.track.artists,
          album: item.track.album,
        }));

        setTracks(extractedTracks);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch playlist tracks:', err);
        setLoading(false);
      }
    }

    fetchTracks();
  }, [accessToken, playlistId]);

  if (loading) return <p>Loading tracks…</p>;

  return (
    <div>
      <h3>Playlist Tracks</h3>
      {tracks.map((track, i) => (
        <div key={track.uri} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <img src={track.album.images[0]?.url} alt="Album cover" width={64} height={64} />
          <div style={{ marginLeft: '1rem' }}>
            <p><strong>{track.name}</strong></p>
            <p>{track.artists.map((a) => a.name).join(', ')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
