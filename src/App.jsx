import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import { supabase } from './lib/supabaseClient';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadAppUser = async (authUser) => {
    console.log('Loading app user for:', authUser?.id);
    if (!authUser) {
      console.log('No auth user, setting app user to null');
      setAppUser(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      console.log('App user query result:', { data, error });

      if (error) {
        console.error('Error loading app user:', error);
        // If app_users table doesn't exist yet, create a temporary user object
        if (error.code === 'PGRST116' || error.message?.includes('relation "app_users" does not exist')) {
          console.log('app_users table not found, using temporary user');
          setAppUser({
            playerId: 1,
            auth_user_id: authUser.id,
            username: authUser.email?.split('@')[0] || 'temp_user',
            slogan: ''
          });
        } else {
          setAppUser(null);
        }
      } else {
        console.log('Setting app user:', data);
        setAppUser(data);
      }
    } catch (err) {
      console.error('Error loading app user:', err);
      setAppUser(null);
    }
  };

  useEffect(() => {
    console.log('App useEffect running');
    // Simplified initialization - bypass Supabase for now
    setTimeout(() => {
      console.log('Setting loading to false');
      setLoading(false);
      setUser(null); // No user initially
      setAppUser(null);
    }, 1000);
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
          <NavBar user={user} appUser={appUser} />
        </header>
      )}

      <main className="app__main">
        <Outlet context={{ user, appUser, setUser, setAppUser }} />
      </main>

      {!hideNavbar && (
        <footer className="app__footer">
          <div className="footer-content">
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
