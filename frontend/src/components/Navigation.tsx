import { getCurrentUserId } from "utils/userUtils";
import "../styling/Navigation.css";
import { useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const isLoggedIn = Boolean(getCurrentUserId());

  const navigate = useNavigate();
  
  const handleJournal = () => {
    navigate("/tickets");
  };

  const handleCalendar = () => {
    navigate("/calendar");
  };

  const handleAccount = () => {
    navigate("/account");
  };

  return (
    <div className="nav-container">
      <div className="logo left">ENCORE</div>
      {isLoggedIn && (
        <div className="pages middle">
          <div id="journal" onClick={handleJournal}>journal entries</div>
          <div id="calendar" onClick={handleCalendar}>calendar</div>
        </div>
      )}
      <div className="pages right">
      <div id="account" onClick={handleAccount}>{isLoggedIn ? "my account" : "login"}</div>

      </div>
    </div>
  );
};
export default Navigation;
