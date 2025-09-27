import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import RaceCard from '../components/RaceCard';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const { user } = useOutletContext();
  const [localUser, setLocalUser] = useState(user);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Use user from context
      const currentUser = user || localUser;

      // Load upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*, races(count)')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(6);

      setUpcomingEvents(events || []);

      // Load recent bets for user
      if (currentUser) {
        const { data: bets } = await supabase
          .from('bets')
          .select('*, races(name, start_time, events(name))')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentBets(bets || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1>Welcome back{user?.user_metadata?.username ? `, ${user.user_metadata.username}` : ''}!</h1>
          <p>Ready to place some winning bets?</p>
        </div>

        <div className="dashboard__quick-actions">
          <Link to="/events" className="dashboard__action-btn">
            Browse Events
          </Link>
          <Link to="/account" className="dashboard__action-btn dashboard__action-btn--secondary">
            Account Settings
          </Link>
        </div>
      </div>


      <div className="dashboard__content">
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="dashboard__section-link">
              View All
            </Link>
          </div>

          <div className="dashboard__events">
            {upcomingEvents.length === 0 ? (
              <div className="dashboard__empty">
                <p>No upcoming events scheduled.</p>
                <Link to="/events" className="dashboard__empty-action">
                  Browse Events
                </Link>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="dashboard__event-card">
                  <div className="dashboard__event-info">
                    <h3>
                      <Link to={`/event/${event.id}`} className="dashboard__event-link">
                        {event.name}
                      </Link>
                    </h3>
                    <p className="dashboard__event-description">{event.description}</p>
                    <p className="dashboard__event-date">
                      {formatDate(event.start_date)}
                    </p>
                    <p className="dashboard__event-races">
                      {event.races?.length || 0} races
                    </p>
                  </div>
                  <div className="dashboard__event-actions">
                    <Link to={`/event/${event.id}`} className="dashboard__event-btn">
                      View Event
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {user && recentBets.length > 0 && (
          <div className="dashboard__section">
            <div className="dashboard__section-header">
              <h2>Recent Bets</h2>
              <Link to="/events" className="dashboard__section-link">
                View Events
              </Link>
            </div>

            <div className="dashboard__bets">
              {recentBets.map(bet => (
                <div key={bet.id} className="dashboard__bet-card">
                  <div className="dashboard__bet-info">
                    <h4>{bet.races?.name || 'Unknown Race'}</h4>
                    <p className="dashboard__bet-event">
                      Event: {bet.races?.events?.name || 'Unknown Event'}
                    </p>
                    <p className="dashboard__bet-type">
                      {bet.bet_type.toUpperCase()} - {formatCurrency(bet.amount)}
                    </p>
                    <p className="dashboard__bet-date">
                      {formatDate(bet.created_at)}
                    </p>
                  </div>

                  <div className="dashboard__bet-status">
                    <span className={`dashboard__bet-badge dashboard__bet-badge--${bet.status}`}>
                      {bet.status}
                    </span>
                    {bet.payout > 0 && (
                      <span className="dashboard__bet-payout">
                        +{formatCurrency(bet.payout)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user && (
          <div className="dashboard__guest">
            <div className="dashboard__guest-content">
              <h2>Join the Action!</h2>
              <p>Create an account to start betting on races and track your winnings.</p>
              <div className="dashboard__guest-actions">
                <Link to="/register" className="dashboard__action-btn">
                  Sign Up Now
                </Link>
                <Link to="/login" className="dashboard__action-btn dashboard__action-btn--secondary">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}