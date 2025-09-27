import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function NavBar({ user, appUser }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav>
      <div className="nav-brand">
        <Link to="/dashboard">
          <h2>Horse Betting</h2>
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/events">Events</Link>
        <Link to="/races">Races</Link>
        <Link to="/commissioner">Management</Link>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <span>Welcome, {user.email}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button type="button">Login</button>
            </Link>
            <Link to="/register">
              <button type="button">Sign Up</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}