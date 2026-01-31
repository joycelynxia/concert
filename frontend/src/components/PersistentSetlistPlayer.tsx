import React, { useState } from "react";
import { usePlayer } from "context/PlayerContext";
import { useSpotify } from "context/SpotifyContext";
import { SpotifyPlayer } from "components/Spotify/SpotifyPlayer";
import { SpotifyLogin } from "components/Spotify/SpotifyLogin";
import { X, ExternalLink } from "lucide-react";
import "../styling/PersistentSetlistPlayer.css";

const formatYoutubeId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : trimmed;
};

export const PersistentSetlistPlayer: React.FC = () => {
  const { activePlaylists, clearPlaylists } = usePlayer();
  const { tokens } = useSpotify();
  const [isMinimized, setIsMinimized] = useState(false);

  const hasSpotify = !!activePlaylists.spotify && !!tokens;
  const hasYoutube = !!activePlaylists.youtube;

  if (!hasSpotify && !hasYoutube) return null;

  return (
    <div className={`persistent-player ${isMinimized ? "minimized" : ""}`}>
      <div className="persistent-player-header">
        <span className="persistent-player-label">Now playing</span>
        <div className="persistent-player-actions">
          <button
            className="persistent-player-minimize"
            onClick={() => setIsMinimized((p) => !p)}
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>
          <button
            className="persistent-player-close"
            onClick={clearPlaylists}
            aria-label="Stop playback"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="persistent-player-content">
          {hasSpotify && (
            <SpotifyPlayer
              accessToken={tokens!.access_token}
              playlistId={activePlaylists.spotify!}
            />
          )}
          {hasYoutube && (
            <a
              href={`https://www.youtube.com/playlist?list=${formatYoutubeId(activePlaylists.youtube!)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="youtube-playlist-link"
            >
              <ExternalLink size={18} />
              Open YouTube playlist in new tab
            </a>
          )}
          {activePlaylists.spotify && !tokens && !hasYoutube && (
            <div className="spotify-login-prompt">
              <span>Log in to Spotify to play</span>
              <SpotifyLogin />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
