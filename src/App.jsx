import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import { supabase } from './lib/supabaseClient';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show navbar on login/register pages
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Horse Betting Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!hideNavbar && (
        <header className="app__header">
          <NavBar user={user} />
        </header>
      )}

      <main className="app__main">
        <Outlet context={{ user, setUser }} />
      </main>

      {!hideNavbar && (
        <footer className="app__footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Horse Betting Platform</h4>
              <p>Your premier destination for horse race betting.</p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/races">Races</a></li>
                <li><a href="/events">Events</a></li>
                <li><a href="/account">Account</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
