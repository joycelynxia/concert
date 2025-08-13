import React from "react";
import { useSpotify } from "context/SpotifyContext";
import "../../styling/SpotifyButtons.css";
import Tippy from "@tippyjs/react";
import 'tippy.js/dist/tippy.css';

export const SpotifyLogoutButton = () => {
  const { setTokens } = useSpotify();

  const handleLogout = () => {
    setTokens(null); // clears context
    localStorage.removeItem("spotify_tokens");
    window.location.href = "/"; // optional: redirect to home
  };

  return (
    <div onClick={handleLogout}>
      <Tippy content="logout">
        <img className="spotify-logo" src="./spotify-512-blue.png" />
      </Tippy>
    </div>
  );
};
