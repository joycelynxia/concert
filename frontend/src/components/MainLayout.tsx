import React from "react";
import Sidebar from "./Sidebar";
import "../styling/MainLayout.css";
import Navigation from "./Navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Navigation />

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

export default MainLayout;
