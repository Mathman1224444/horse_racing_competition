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
        // If app_users table doesn't exist or no record found, create a temporary user object
        if (error.code === 'PGRST116' ||
            error.message?.includes('relation "app_users" does not exist') ||
            error.message?.includes('No rows returned')) {
          console.log('Creating temporary user object');
          setAppUser({
            playerId: Math.floor(Math.random() * 1000000), // Random temp ID
            auth_user_id: authUser.id,
            username: authUser.email?.split('@')[0] || 'temp_user',
            slogan: ''
          });
        } else {
          console.log('Setting app user to null due to error');
          setAppUser(null);
        }
      } else {
        console.log('Setting app user from database:', data);
        setAppUser(data);
      }
    } catch (err) {
      console.error('Unexpected error loading app user:', err);
      // Create temporary user as fallback
      setAppUser({
        playerId: Math.floor(Math.random() * 1000000),
        auth_user_id: authUser.id,
        username: authUser.email?.split('@')[0] || 'temp_user',
        slogan: ''
      });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session check result:', { session, error });

        if (error) {
          console.error('Session error:', error);
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await loadAppUser(session.user);
        } else {
          setAppUser(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change:', _event, session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadAppUser(session.user);
      } else {
        setAppUser(null);
      }
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
