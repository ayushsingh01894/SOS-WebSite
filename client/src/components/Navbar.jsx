import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span className="navbar-brand-icon">🚨</span> Silent SOS
      </Link>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/emergency-contacts">Contacts</Link>
        <Link to="/sos-history">History</Link>
        <Link to="/profile">Profile</Link>
        <button onClick={handleLogout} className="navbar-logout">Logout</button>
      </div>
    </nav>
  );
}
