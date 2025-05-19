import React, { useEffect, useState, useRef } from 'react';

interface SpotifyPlayerProps {
  accessToken: string;
  playlistId?: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ accessToken, playlistId }) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [player, setPlayer] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<any>(null);

  // Setup Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;


    const setupPlayer = () => {
      if (!window.Spotify) {
        console.error('Spotify SDK not loaded yet');
        return;
      }

      const _player = new window.Spotify.Player({
        name: 'Concert Tracker Player',
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
        volume: 0.5,
      });

      _player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      _player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        const { current_track } = state.track_window;
        setCurrentTrack(current_track);
        setProgress(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      });

      _player.connect();
      setPlayer(_player);
    };

    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = setupPlayer;
    } else {
      setupPlayer();
    }

    return () => {
      if (player) player.disconnect();
      window.onSpotifyWebPlaybackSDKReady = () => {};
    };
  }, [accessToken]);

  // Fetch playlist tracks
  useEffect(() => {
    if (!accessToken || !playlistId) return;

    const fetchTracks = async () => {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();
        const items = data.tracks.items.map((item: any) => ({
          name: item.track.name,
          uri: item.track.uri,
          artists: item.track.artists.map((a: any) => a.name).join(', '),
          albumImage: item.track.album.images[0]?.url,
        }));

        setTracks(items);
      } catch (err) {
        console.error('Error fetching playlist tracks:', err);
      }
    };

    fetchTracks();
  }, [accessToken, playlistId]);

  useEffect(() => {
    if (!player) return;
  
    intervalRef.current = setInterval(async () => {
      const state = await player.getCurrentState();
      if (state) {
        setProgress(state.position);
        setDuration(state.duration);
      }
    }, 1000); // update every second
  
    return () => clearInterval(intervalRef.current);
  }, [player]);
  
  const playTrack = async (trackUri: string) => {
    if (!deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });
    } catch (err) {
      console.error('Error playing track:', err);
    }
  };
 
  const togglePlayPause = async () => {
    if (!player) return;
  
    const state = await player.getCurrentState();
    if (!state) return;
  
    if (state.paused) {
      await player.resume();
    } else {
      await player.pause();
    }
  };    
  
  const handleNext = () => player?.nextTrack();
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value);
    player?.seek(newPosition);
    setProgress(newPosition);
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Spotify Player</h3>
      {!isReady ? (
        <p>Loading Spotify Player...</p>
      ) : (
        <>
          <div>
            {tracks.map((track, index) => (
              <div key={track.uri} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <img src={track.albumImage} alt={track.name} width={64} height={64} />
                <div style={{ marginLeft: '1rem', flexGrow: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{track.name}</p>
                  <p style={{ margin: 0 }}>{track.artists}</p>
                </div>
                <button onClick={() => playTrack(track.uri)}>▶️</button>
              </div>
            ))}
          </div>

          {currentTrack && (
            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #ccc' }}>
              <h4>Now Playing</h4>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={currentTrack.album?.images?.[0]?.url || ''}
                  width={64}
                  height={64}
                  alt="Album"
                />
                <div style={{ marginLeft: '1rem', flexGrow: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{currentTrack.name}</p>
                  <p style={{ margin: 0 }}>
                    {currentTrack.artists?.map((a: any) => a.name).join(', ') || ''}
                  </p>
                </div>
                <button onClick={togglePlayPause}>
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button onClick={handleNext}>⏭️</button>
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                value={progress}
                onChange={handleSeek}
                style={{ width: '100%', marginTop: '1rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};
