import "../styling/Navigation.css";
import { useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  
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
    </div>
  );
};
export default Navigation;
