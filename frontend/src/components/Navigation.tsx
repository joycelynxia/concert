import "../styling/Navigation.css";
import { useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  
  const handleJournal = () => {
    navigate("/");
  };

  const handleCalendar = () => {
    navigate("/calendar");
  };

  const handleAccount = () => {
    navigate("/account");
  };

  return (
    <div className="nav-container">
      <div className="logo">ENCORE</div>
      <div className="pages">
        <div id="journal" onClick={handleJournal}>journal entries</div>
        <div id="calendar" onClick={handleCalendar}>calendar</div>
        <div id="account" onClick={handleAccount}>my account</div>
      </div>
    </div>
  );
};
export default Navigation;
