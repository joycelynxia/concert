import React from 'react';
import Sidebar from './Sidebar';
import '../styling/MainLayout.css'

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({children}) => {
    return (
        <div style={{display:'flex'}}>
            <Sidebar/>

            <div style={{flex:1}}>
                {children}
            </div>
        </div>
    );
};

export default MainLayout;