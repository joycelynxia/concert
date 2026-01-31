import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import "../../styling/YouTubePlayer.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  playlistId: string;
}

const formatYoutubePlaylistId = (input: string): string => {
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return trimmed;
};

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ playlistId }) => {
  const [showPlayer, setShowPlayer] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const id = formatYoutubePlaylistId(playlistId);
  const watchUrl = id ? `https://www.youtube.com/playlist?list=${id}` : "";

  useEffect(() => {
    if (!id || !showPlayer || !containerRef.current) return;

    setEmbedError(false);

    const container = containerRef.current;
    const playerDiv = document.createElement("div");
    playerDiv.style.width = "100%";
    playerDiv.style.height = "100%";
    container.appendChild(playerDiv);

    const initPlayer = () => {
      if (!window.YT?.Player) return;

      // Destroy existing player (removes iframe, cleans up)
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(playerDiv, {
        height: "100%",
        width: "100%",
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            // Start at index 1 (second video) - first video often has embedding disabled
            e.target.loadPlaylist({
              list: id,
              listType: "playlist",
              index: 1,
            });
          },
          onError: () => {
            setEmbedError(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript.parentNode?.insertBefore(tag, firstScript);
      } else if (window.YT?.Player) {
        initPlayer();
      }
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
      if (playerDiv.parentNode) {
        playerDiv.parentNode.removeChild(playerDiv);
      }
    };
  }, [id, showPlayer]);

  if (!id) return null;

  return (
    <div className="youtube-setlist-player">
      <div className="youtube-player-header">
        <button
          className="youtube-toggle-btn"
          onClick={() => setShowPlayer((prev) => !prev)}
          aria-label={showPlayer ? "Collapse" : "Expand"}
        >
          {showPlayer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <h3 className="youtube-player-title">Setlist (YouTube)</h3>
      </div>

      {showPlayer && (
        <div className="youtube-player-container">
          {embedError ? (
            <div className="youtube-embed-fallback">
              <p>This playlist can&apos;t be embedded (video owner restrictions).</p>
              <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="youtube-open-link youtube-open-btn">
                <ExternalLink size={18} /> Open on YouTube
              </a>
            </div>
          ) : (
            <div className="youtube-embed-wrapper">
              <div ref={containerRef} className="youtube-embed-inner" />
            </div>
          )}
          <p className="youtube-fallback-note">
            No Spotify Premium? Use this YouTube playlist instead—free for everyone.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="youtube-open-link"
          >
            <ExternalLink size={14} /> Open playlist on YouTube
          </a>
        </div>
      )}
    </div>
  );
};
