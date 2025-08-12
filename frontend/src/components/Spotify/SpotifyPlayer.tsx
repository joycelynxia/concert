import React, { useEffect, useState, useRef } from "react";
import "../../styling/SpotifyPlayer.css";
import { ChevronUp, ChevronDown, Play, Pause, SkipForward } from "lucide-react";

interface SpotifyPlayerProps {
  accessToken: string;
  playlistId?: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }

  namespace Spotify {
    interface PlayerInit {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }

    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(event: string, callback: (args: any) => void): boolean;
      removeListener(event: string): boolean;
      pause(): Promise<void>;
      resume(): Promise<void>;
      nextTrack(): Promise<void>;
      previousTrack(): Promise<void>;
      seek(position_ms: number): Promise<void>;
      getCurrentState(): Promise<PlayerState | null>;
    }

    interface PlayerState {
      duration: number;
      position: number;
      paused: boolean;
      track_window: {
        current_track: Track;
        previous_tracks: Track[];
        next_tracks: Track[];
      };
    }

    interface Track {
      uri: string;
      id: string;
      name: string;
      type: string;
      artists: { name: string }[];
      album: {
        images: { url: string }[];
      };
    }

    interface PlaybackInstance {
      device_id: string;
    }
  }
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  accessToken,
  playlistId,
}) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSetlist, setShowSetlist] = useState(true);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!accessToken) return;

    const setupPlayer = () => {
      if (!window.Spotify) {
        console.error("Spotify SDK not loaded yet");
        return;
      }

      const _player = new window.Spotify.Player({
        name: "Concert Tracker Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      _player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      _player.addListener(
        "player_state_changed",
        (state: Spotify.PlayerState) => {
          if (!state) return;
          const { current_track } = state.track_window;
          setCurrentTrack(current_track);
          setProgress(state.position);
          setDuration(state.duration);
          setIsPlaying(!state.paused);
        }
      );

      _player.connect();
      setPlayer(_player);
    };

    const loadSdk = () => {
      const existingScript = document.getElementById("spotify-sdk");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "spotify-sdk";
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        script.onload = () => {
          window.onSpotifyWebPlaybackSDKReady = setupPlayer;
          if (window.Spotify) {
            setupPlayer();
          }
        };
        document.body.appendChild(script);
      } else {
        if (window.Spotify) {
          setupPlayer();
        } else {
          const checkInterval = setInterval(() => {
            if (window.Spotify) {
              clearInterval(checkInterval);
              setupPlayer();
            }
          }, 100);
        }
      }
    };
    loadSdk();

    return () => {
      if (player) player.disconnect();
      window.onSpotifyWebPlaybackSDKReady = () => {};
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !playlistId) return;

    const fetchTracks = async () => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = await res.json();
        const items = data.tracks.items.map((item: any) => ({
          name: item.track.name,
          uri: item.track.uri,
          artists: item.track.artists.map((a: any) => a.name).join(", "),
          albumImage: item.track.album.images[0]?.url,
        }));

        setTracks(items);
      } catch (err) {
        console.error("Error fetching playlist tracks:", err);
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
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [player]);

  const playTrack = async (trackUri: string) => {
    if (!deviceId) return;

    const trackUris = tracks.map((t) => t.uri);
    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: trackUris,
            offset: { uri: trackUri },
          }),
        }
      );
    } catch (err) {
      console.error("Error playing track:", err);
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
    const secs = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          className="spotify-icon-btn"
          onClick={() => setShowSetlist((prev) => !prev)}
        >
          {showSetlist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <h3 style={{ margin: 0, padding: "0.5rem" }}>Setlist</h3>
      </div>

      {!isReady ? (
        <p>Loading Spotify Player...</p>
      ) : (
        <>
          {showSetlist && (
            <div className="setlist-container">
              {tracks.map((track, index) => (
                <div
                  key={track.uri}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                  onClick={() => playTrack(track.uri)}
                >
                  <img
                    src={track.albumImage}
                    alt={track.name}
                    width={64}
                    height={64}
                    className="album-image"
                  />
                  <div style={{ marginLeft: "1rem", flexGrow: 1 }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      {track.name}
                    </p>
                    <p style={{ margin: 0 }}>{track.artists}</p>
                  </div>
                  {/* <button
                    className="spotify-btn"
                    onClick={() => playTrack(track.uri)}
                  >
                    <Play size={20} />
                  </button> */}
                </div>
              ))}
            </div>
          )}

          {currentTrack && (
            <div className="music-player-container">
              <div className="current-track">
                <div className="track-info">
                  <img
                    className="album-image"
                    src={currentTrack.album?.images?.[0]?.url || ""}
                    width={50}
                    height={50}
                    alt="Album"
                  />
                  <div className="artist-and-title">
                    <p id="title">
                      {currentTrack.name}
                    </p>
                    <p id="artist">
                      {currentTrack.artists
                        ?.map((a: any) => a.name)
                        .join(", ") || ""}
                    </p>
                  </div>
                </div>

                <div className="button-container">
                  <button className="spotify-btn" onClick={togglePlayPause}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button className="spotify-btn" onClick={handleNext}>
                    <SkipForward size={20} />
                  </button>
                </div>

                <div className="progress-bar">
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    value={progress}
                    onChange={handleSeek}
                    style={{ width: "100%", marginTop: "1rem" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
