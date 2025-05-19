import React from 'react';
import {Link} from 'react-router-dom'
import '../styling/Sidebar.css'
import { SpotifyLogin } from './Spotify/SpotifyLogin';
import { SpotifyLogoutButton } from './Spotify/SpotifyLogoutVButton';
const Sidebar: React.FC = () => {
    return (
        <div className='sidebar'>
            <h2 className='sidebar-title'>ENCORE</h2>
            <nav>
                <ul className='sidebar-nav'>
                    <li className='sidebar-link'>
                        <Link to="/" className='sidebar-link'>
                        Home
                        </Link>
                    </li>
                    <li className='sidebar-link'>
                        <Link to="/calendar" className='sidebar-link'>
                        Calendar
                        </Link>
                    </li>
                    <li className='sidebar-login'>
                        <SpotifyLogin/>
                    </li>
                    <li>
                        <SpotifyLogoutButton/>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;