import React from 'react';
import {Link} from 'react-router-dom'
import '../styling/Sidebar.css'
const Sidebar: React.FC = () => {
    return (
        <div className='sidebar'>
            <h2 className='sidebar-title'>Concert Memories</h2>
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
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;