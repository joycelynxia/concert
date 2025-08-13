import { useSpotify } from "context/SpotifyContext";
import "../styling/Navigation.css";
import { SpotifyLogin } from "./Spotify/SpotifyLogin";
import { Navigate, useNavigate } from "react-router-dom";
import { SpotifyLogoutButton } from "./Spotify/SpotifyLogoutButton";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { tokens } = useSpotify();
  
  const handleJournal = () => {
    navigate("/");
  };

  const handleTracker = () => {
    navigate("/tracker");
  };

  return (
    <div className="nav-container">
      <div className="logo">ENCORE</div>
      <div className="pages">
        <div id="journal" onClick={handleJournal}>journal entries</div>
        <div id="tracker" onClick={handleTracker}>concert tracker</div>
      </div>
      {tokens ? <SpotifyLogoutButton/> : <SpotifyLogin /> }
    </div>
  );
};
export default Navigation;
