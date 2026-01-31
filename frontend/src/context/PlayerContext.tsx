import React, { createContext, useContext, useState, useCallback } from "react";

interface ActivePlaylists {
  spotify: string | null;
  youtube: string | null;
}

interface PlayerContextValue {
  activePlaylists: ActivePlaylists;
  setActivePlaylists: (playlists: Partial<ActivePlaylists>) => void;
  clearPlaylists: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activePlaylists, setState] = useState<ActivePlaylists>({
    spotify: null,
    youtube: null,
  });

  const setActivePlaylists = useCallback((playlists: Partial<ActivePlaylists>) => {
    setState((prev) => ({
      spotify: playlists.spotify !== undefined ? playlists.spotify : prev.spotify,
      youtube: playlists.youtube !== undefined ? playlists.youtube : prev.youtube,
    }));
  }, []);

  const clearPlaylists = useCallback(() => {
    setState({ spotify: null, youtube: null });
  }, []);

  return (
    <PlayerContext.Provider
      value={{ activePlaylists, setActivePlaylists, clearPlaylists }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
