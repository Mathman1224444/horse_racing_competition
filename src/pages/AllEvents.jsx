import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AllEvents() {
  const { user, appUser } = useOutletContext();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appUser) {
      loadEvents();
    }
  }, [appUser]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const { data: entrants, error: entrantsError } = await supabase
        .from('entrants')
        .select('eventId')
        .eq('playerId', appUser.playerId);

      if (entrantsError) throw entrantsError;

      const eventIds = entrants.map(e => e.eventId);

      if (eventIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('eventId', eventIds);

      if (eventsError) throw eventsError;

      const eventsWithDetails = await Promise.all(
        eventsData.map(async (event) => {
          const leaderboard = await getLeaderboard(event.eventId);
          const lastRace = await getLastRace(event.eventId);
          const nextRace = await getNextRace(event.eventId);

          return {
            ...event,
            leaderboard,
            lastRace,
            nextRace
          };
        })
      );

      setEvents(eventsWithDetails);
    } catch (err) {
      setError('Error loading events: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboard = async (eventId) => {
    try {
      const { data: entrants, error } = await supabase
        .from('entrants')
        .select(`
          playerId,
          app_users:playerId (username)
        `)
        .eq('eventId', eventId);

      if (error) throw error;

      const leaderboardData = await Promise.all(
        entrants.map(async (entrant) => {
          const { data: bets, error: betsError } = await supabase
            .from('bets')
            .select('bet_winnings')
            .eq('playerId', entrant.playerId)
            .eq('eventId', eventId);

          if (betsError) throw betsError;

          const totalWinnings = bets.reduce((sum, bet) => sum + (bet.bet_winnings || 0), 0);

          return {
            username: entrant.app_users?.username || 'Unknown',
            winnings: totalWinnings
          };
        })
      );

      return leaderboardData
        .sort((a, b) => b.winnings - a.winnings)
        .slice(0, 5);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      return [];
    }
  };

  const getLastRace = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select(`
          *,
          race_results:race_resultsId (*)
        `)
        .eq('eventId', eventId)
        .eq('is_resolved', true)
        .order('race_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    } catch (err) {
      console.error('Error loading last race:', err);
      return null;
    }
  };

  const getNextRace = async (eventId) => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('eventId', eventId)
        .eq('is_resolved', false)
        .order('race_number', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data[0] || null;
    } catch (err) {
      console.error('Error loading next race:', err);
      return null;
    }
  };

  const handleAddEvent = () => {
    navigate('/add-event');
  };

  const handleDeleteEvent = (eventId) => {
    // This would implement event deletion when confirmed
    console.log('Delete event functionality to be implemented for eventId:', eventId);
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="all-events-page">
      <div className="events-header">
        <h1>All Events</h1>
        {appUser && (
          <div className="user-actions">
            <button onClick={handleAddEvent} className="add-event-button">
              Add Event
            </button>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>You are not currently entered in any events.</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="event-header">
                <h2>
                  <Link to={`/event/${event.eventId}`}>
                    {event.event_name}
                  </Link>
                </h2>
                {appUser && (
                  <button
                    onClick={() => handleDeleteEvent(event.eventId)}
                    className="delete-event-button"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="event-sections">
                <div className="leaderboard-section">
                  <h3>Leaderboard</h3>
                  {event.leaderboard?.length > 0 ? (
                    <ul className="leaderboard">
                      {event.leaderboard.map((player, index) => (
                        <li key={index}>
                          {player.username}: ${player.winnings.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No winners yet</p>
                  )}
                </div>

                <div className="last-race-section">
                  <h3>Most Recent Race Results</h3>
                  {event.lastRace ? (
                    <div className="race-summary">
                      <p>Race {event.lastRace.race_number}</p>
                      {event.lastRace.race_results && (
                        <p>
                          Winner: Horse {event.lastRace.race_results.first_horse}
                        </p>
                      )}
                      <Link to={`/race/${event.lastRace.raceId}`}>
                        View Details
                      </Link>
                    </div>
                  ) : (
                    <p>No races completed yet</p>
                  )}
                </div>

                <div className="next-race-section">
                  <h3>Next Race</h3>
                  {event.nextRace ? (
                    <div className="race-summary">
                      <p>Race {event.nextRace.race_number}</p>
                      <p>Post Time: {new Date(event.nextRace.post_time).toLocaleString()}</p>
                      <Link to={`/race/${event.nextRace.raceId}`}>
                        View Details
                      </Link>
                    </div>
                  ) : (
                    <p>No upcoming races</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}