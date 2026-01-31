import React from "react";
import Sidebar from "./Sidebar";
import "../styling/MainLayout.css";
import "../styling/PersistentSetlistPlayer.css";
import Navigation from "./Navigation";
import { PersistentSetlistPlayer } from "./PersistentSetlistPlayer";
import { usePlayer } from "context/PlayerContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { activePlaylists } = usePlayer();
  const hasPlayer =
    !!activePlaylists.spotify || !!activePlaylists.youtube;

  return (
    <div
      className={`main-layout ${hasPlayer ? "has-persistent-player" : ""}`}
    >
      <Navigation />

      <div style={{ flex: 1 }}>{children}</div>

      <PersistentSetlistPlayer />
    </div>
  );
};

export default MainLayout;
