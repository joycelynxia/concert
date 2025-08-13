import "../../styling/SpotifyButtons.css";
import Tippy from "@tippyjs/react";
import { useSpotify } from "context/SpotifyContext";
import "tippy.js/dist/tippy.css";

export function SpotifyLogin() {
  const login = () => {
    window.location.href = "http://127.0.0.1:4000/api/auth/login";
  };

  return (
    <div onClick={login}>
      <Tippy content="login">
        <img className="spotify-logo" src="./spotify-512-blue.png" />
      </Tippy>
    </div>
  );
}
