import React from 'react';
import { Link } from 'react-router-dom';
import '../styling/Sidebar.css';
import { SpotifyLogin } from './Spotify/SpotifyLogin';
import { SpotifyLogoutButton } from './Spotify/SpotifyLogoutVButton';
import { useSpotify } from 'context/SpotifyContext';
import { Home, Calendar } from 'lucide-react'; // icons

const Sidebar: React.FC = () => {
  const { tokens } = useSpotify();

  return (
    <div className='sidebar'>
      <div>
        <h2 className='sidebar-title'>ENCORE</h2>
        <nav className='sidebar-nav'>
          <Link to="/" className='sidebar-link'>
            <Home className='sidebar-icon' /> Home
          </Link>
          <Link to="/calendar" className='sidebar-link'>
            <Calendar className='sidebar-icon' /> Calendar
          </Link>
        </nav>
      </div>

      <div className='sidebar-spotify'>
        {!tokens ? (
          <div id='login'><SpotifyLogin /></div>
        ) : (
          <div id='logout'><SpotifyLogoutButton /></div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
