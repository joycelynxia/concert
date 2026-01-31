import React from 'react';
import { Link } from 'react-router-dom';
import '../styling/Sidebar.css';
import { Home, Calendar } from 'lucide-react';

const Sidebar: React.FC = () => {
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
    </div>
  );
};

export default Sidebar;
