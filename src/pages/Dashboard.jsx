import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import RaceCard from '../components/RaceCard';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const { user } = useOutletContext();
  const [localUser, setLocalUser] = useState(user);
  const [upcomingRaces, setUpcomingRaces] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWagered: 0,
    totalWinnings: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Use user from context
      const currentUser = user || localUser;

      // Load upcoming races
      const { data: races } = await supabase
        .from('races')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(6);

      setUpcomingRaces(races || []);

      // Load recent bets for user
      if (currentUser) {
        const { data: bets } = await supabase
          .from('bets')
          .select('*, races(name, start_time)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentBets(bets || []);

        // Calculate stats
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (userStats) {
          setStats(userStats);
        }
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
          <h1>Welcome back{user?.email ? `, ${user.email}` : ''}!</h1>
          <p>Ready to place some winning bets?</p>
        </div>

        <div className="dashboard__quick-actions">
          <Link to="/races" className="dashboard__action-btn">
            View All Races
          </Link>
          <Link to="/account" className="dashboard__action-btn dashboard__action-btn--secondary">
            Account Settings
          </Link>
        </div>
      </div>

      {user && (
        <div className="dashboard__stats">
          <div className="dashboard__stat-card">
            <h3>Total Bets</h3>
            <span className="dashboard__stat-value">{stats.totalBets}</span>
          </div>
          <div className="dashboard__stat-card">
            <h3>Total Wagered</h3>
            <span className="dashboard__stat-value">{formatCurrency(stats.totalWagered)}</span>
          </div>
          <div className="dashboard__stat-card">
            <h3>Total Winnings</h3>
            <span className="dashboard__stat-value dashboard__stat-value--positive">
              {formatCurrency(stats.totalWinnings)}
            </span>
          </div>
          <div className="dashboard__stat-card">
            <h3>Win Rate</h3>
            <span className="dashboard__stat-value">
              {(stats.winRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="dashboard__content">
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Upcoming Races</h2>
            <Link to="/races" className="dashboard__section-link">
              View All
            </Link>
          </div>

          <div className="dashboard__races">
            {upcomingRaces.length === 0 ? (
              <div className="dashboard__empty">
                <p>No upcoming races scheduled.</p>
                <Link to="/events" className="dashboard__empty-action">
                  Browse Events
                </Link>
              </div>
            ) : (
              upcomingRaces.map(race => (
                <RaceCard
                  key={race.id}
                  race={race}
                  showBettingButton={true}
                />
              ))
            )}
          </div>
        </div>

        {user && recentBets.length > 0 && (
          <div className="dashboard__section">
            <div className="dashboard__section-header">
              <h2>Recent Bets</h2>
              <Link to="/bets" className="dashboard__section-link">
                View All
              </Link>
            </div>

            <div className="dashboard__bets">
              {recentBets.map(bet => (
                <div key={bet.id} className="dashboard__bet-card">
                  <div className="dashboard__bet-info">
                    <h4>{bet.races?.name || 'Unknown Race'}</h4>
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