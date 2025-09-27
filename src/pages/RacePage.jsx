import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import BetForm from '../components/BetForm';
import { supabase } from '../lib/supabaseClient';
import { evaluateBet } from '../lib/betEvaluator';

export default function RacePage() {
  const { raceId } = useParams();
  const { user, appUser } = useOutletContext();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [horses, setHorses] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [showManagement, setShowManagement] = useState(true);
  const [managementMode, setManagementMode] = useState(false);
  const [scratchedHorses, setScratchedHorses] = useState(new Set());

  useEffect(() => {
    if (raceId) {
      loadRaceData();
    }
  }, [raceId]);

  const loadRaceData = async () => {
    try {
      setLoading(true);
      setError('');

      // User is already available from context

      // Management features available to all users

      // Load race details with event info and race number calculation
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*, events(name)')
        .eq('id', raceId)
        .single();

      if (raceError) {
        throw raceError;
      }

      // Calculate race number within the event
      if (raceData.event_id) {
        const { data: eventRaces, error: eventRacesError } = await supabase
          .from('races')
          .select('id, start_time')
          .eq('event_id', raceData.event_id)
          .order('start_time', { ascending: true });

        if (!eventRacesError && eventRaces) {
          const raceIndex = eventRaces.findIndex(r => r.id === raceData.id);
          raceData.race_number = raceIndex + 1;
        }
      }

      setRace(raceData);

      // Load horses for this race
      const { data: horsesData, error: horsesError } = await supabase
        .from('horses')
        .select('*')
        .eq('race_id', raceId)
        .order('program_number', { ascending: true });

      if (horsesError) {
        throw horsesError;
      }

      setHorses(horsesData || []);

      // Load scratched horses
      if (horsesData && horsesData.length > 0) {
        const scratchedIds = horsesData
          .filter(horse => horse.scratched)
          .map(horse => horse.id);
        setScratchedHorses(new Set(scratchedIds));
      }

      // Load user's bets for this race
      if (user) {
        const { data: betsData, error: betsError } = await supabase
          .from('bets')
          .select('*')
          .eq('race_id', raceId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (betsError) {
          console.error('Error loading bets:', betsError);
        } else {
          setBets(betsData || []);
        }
      }
    } catch (err) {
      console.error('Error loading race data:', err);
      setError('Failed to load race details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBetSubmit = async (betData) => {
    if (!user) {
      setError('Please log in to place bets');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bets')
        .insert([
          {
            user_id: user.id,
            race_id: raceId,
            ...betData,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new bet to local state
      setBets(prev => [data, ...prev]);
      setActiveTab('bets');
    } catch (err) {
      console.error('Error placing bet:', err);
      setError('Failed to place bet. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRaceStatus = () => {
    if (!race?.start_time) return 'pending';

    const now = new Date();
    const startTime = new Date(race.start_time);

    if (now < startTime) return 'upcoming';
    if (race.status === 'finished') return 'finished';
    return 'running';
  };

  const isBettingOpen = () => {
    const status = getRaceStatus();
    return status === 'upcoming' && !race?.betting_closed;
  };

  const handleHorseScratch = async (horseId, scratched) => {

    try {
      const { error } = await supabase
        .from('horses')
        .update({ scratched })
        .eq('id', horseId);

      if (error) throw error;

      // Update local state
      setScratchedHorses(prev => {
        const updated = new Set(prev);
        if (scratched) {
          updated.add(horseId);
        } else {
          updated.delete(horseId);
        }
        return updated;
      });

      // Reload race data to get updated horses
      await loadRaceData();
    } catch (err) {
      console.error('Error updating horse scratch status:', err);
      setError('Failed to update horse status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="race-page-loading">
        <div className="loading-spinner">Loading race details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="race-page-error">
        <div className="error-content">
          <h2>Error Loading Race</h2>
          <p>{error}</p>
          <Link to="/races" className="error-back-btn">
            Back to Races
          </Link>
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="race-page-not-found">
        <div className="not-found-content">
          <h2>Race Not Found</h2>
          <p>The race you're looking for doesn't exist or has been removed.</p>
          <Link to="/races" className="not-found-back-btn">
            Browse All Races
          </Link>
        </div>
      </div>
    );
  }

  const status = getRaceStatus();
  const bettingOpen = isBettingOpen();

  return (
    <div className="race-page">
      <div className="race-page__header">
        <div className="race-page__breadcrumb">
          <Link to="/races">Races</Link>
          {race.events?.name && (
            <>
              <span className="breadcrumb-separator">›</span>
              <Link to={`/event/${race.event_id}`}>{race.events.name}</Link>
            </>
          )}
          <span className="breadcrumb-separator">›</span>
          <span>{race.name}</span>
        </div>

        <div className="race-page__hero">
          <div className="race-page__info">
            <h1 className="race-page__title">{race.name}</h1>

            <div className="race-page__meta">
              <span className={`race-page__status race-page__status--${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>

              {race.track && (
                <span className="race-page__track">
                  🏁 {race.track}
                </span>
              )}
            </div>

            <div className="race-page__details">
              {race.race_number && (
                <div className="race-page__detail">
                  <strong>Race Number:</strong> {race.race_number}
                </div>
              )}
              <div className="race-page__detail">
                <strong>Start Time:</strong> {formatDateTime(race.start_time)}
              </div>
              {race.distance && (
                <div className="race-page__detail">
                  <strong>Distance:</strong> {race.distance}
                </div>
              )}
              {race.prize_pool && (
                <div className="race-page__detail">
                  <strong>Prize Pool:</strong> {formatCurrency(race.prize_pool)}
                </div>
              )}
              <div className="race-page__detail">
                <strong>Horses:</strong> {horses.length} (Active: {horses.length - scratchedHorses.size})
              </div>
            </div>

            {!bettingOpen && (
              <div className="race-page__betting-status">
                {status === 'finished' ? 'Race Completed' : 'Betting Closed'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="race-page__content">
        <div className="race-page__tabs">
          <button
            className={`race-page__tab ${
              activeTab === 'details' ? 'race-page__tab--active' : ''
            }`}
            onClick={() => setActiveTab('details')}
          >
            Race Details
          </button>
          <button
            className={`race-page__tab ${
              activeTab === 'horses' ? 'race-page__tab--active' : ''
            }`}
            onClick={() => setActiveTab('horses')}
          >
            Horses ({horses.length})
          </button>
          {bettingOpen && (
            <button
              className={`race-page__tab ${
                activeTab === 'betting' ? 'race-page__tab--active' : ''
              }`}
              onClick={() => setActiveTab('betting')}
            >
              Place Bet
            </button>
          )}
          <button
            className={`race-page__tab ${
              activeTab === 'management' ? 'race-page__tab--active' : ''
            }`}
            onClick={() => setActiveTab('management')}
          >
            Race Management
          </button>
          {user && bets.length > 0 && (
            <button
              className={`race-page__tab ${
                activeTab === 'bets' ? 'race-page__tab--active' : ''
              }`}
              onClick={() => setActiveTab('bets')}
            >
              My Bets ({bets.length})
            </button>
          )}
          {status === 'finished' && (
            <button
              className={`race-page__tab ${
                activeTab === 'results' ? 'race-page__tab--active' : ''
              }`}
              onClick={() => setActiveTab('results')}
            >
              Results
            </button>
          )}
        </div>

        <div className="race-page__tab-content">
          {activeTab === 'details' && (
            <div className="race-page__details-content">
              <h3>Race Information</h3>
              {race.description && (
                <p className="race-page__description">{race.description}</p>
              )}

              <div className="race-page__info-grid">
                <div className="race-page__info-item">
                  <h4>Race Type</h4>
                  <p>{race.race_type || 'Standard'}</p>
                </div>
                <div className="race-page__info-item">
                  <h4>Surface</h4>
                  <p>{race.surface || 'Dirt'}</p>
                </div>
                {race.weather && (
                  <div className="race-page__info-item">
                    <h4>Weather</h4>
                    <p>{race.weather}</p>
                  </div>
                )}
                {race.track_condition && (
                  <div className="race-page__info-item">
                    <h4>Track Condition</h4>
                    <p>{race.track_condition}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'horses' && (
            <div className="race-page__horses-content">
              <h3>Field ({horses.length} horses)</h3>
              <div className="race-page__horses-grid">
                {horses.map(horse => (
                  <div
                    key={horse.id}
                    className={`race-page__horse-card ${
                      scratchedHorses.has(horse.id) ? 'race-page__horse-card--scratched' : ''
                    }`}
                  >
                    <div className="race-page__horse-number">
                      #{horse.program_number}
                    </div>
                    <div className="race-page__horse-info">
                      <h4>
                        {horse.name}
                        {scratchedHorses.has(horse.id) && (
                          <span className="race-page__scratch-indicator">(SCRATCHED)</span>
                        )}
                      </h4>
                      {horse.jockey && (
                        <p><strong>Jockey:</strong> {horse.jockey}</p>
                      )}
                      {horse.trainer && (
                        <p><strong>Trainer:</strong> {horse.trainer}</p>
                      )}
                      {horse.odds && (
                        <p className="race-page__horse-odds">
                          <strong>Odds:</strong> {horse.odds}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'betting' && bettingOpen && (
            <div className="race-page__betting-content">
              <BetForm
                horses={horses}
                locked={!bettingOpen}
                onSubmit={handleBetSubmit}
              />
            </div>
          )}

          {activeTab === 'bets' && user && (
            <div className="race-page__bets-content">
              <h3>Your Bets</h3>
              {bets.length === 0 ? (
                <p>You haven't placed any bets on this race yet.</p>
              ) : (
                <div className="race-page__bets-list">
                  {bets.map(bet => (
                    <div key={bet.id} className="race-page__bet-item">
                      <div className="race-page__bet-info">
                        <h4>{bet.bet_type.toUpperCase()} Bet</h4>
                        <p>Amount: {formatCurrency(bet.amount)}</p>
                        <p>Selections: {bet.selections?.join(', ')}</p>
                        {bet.boxed && <p>Boxed: Yes</p>}
                      </div>
                      <div className="race-page__bet-status">
                        <span className={`race-page__bet-badge race-page__bet-badge--${bet.status}`}>
                          {bet.status}
                        </span>
                        {bet.payout > 0 && (
                          <span className="race-page__bet-payout">
                            +{formatCurrency(bet.payout)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && status === 'finished' && (
            <div className="race-page__results-content">
              <h3>Race Results</h3>
              {race.finishing_order ? (
                <div className="race-page__results-list">
                  {race.finishing_order.map((horseId, index) => {
                    const horse = horses.find(h => h.id === horseId);
                    return (
                      <div key={horseId} className="race-page__result-item">
                        <span className="race-page__result-position">
                          {index + 1}
                        </span>
                        <span className="race-page__result-horse">
                          #{horse?.program_number} {horse?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>Results not yet available.</p>
              )}
            </div>
          )}

          {activeTab === 'management' && (
            <div className="race-page__management-content">
              <h3>Race Management</h3>
              <div className="race-page__management-section">
                <h4>Horse Scratch Management</h4>
                <p>Click on a horse to toggle its scratch status:</p>
                <div className="race-page__management-horses">
                  {horses.map(horse => (
                    <div
                      key={horse.id}
                      className={`race-page__management-horse ${
                        scratchedHorses.has(horse.id) ? 'race-page__management-horse--scratched' : ''
                      }`}
                    >
                      <div className="race-page__management-horse-info">
                        <span className="race-page__management-horse-number">
                          #{horse.program_number}
                        </span>
                        <span className="race-page__management-horse-name">
                          {horse.name}
                        </span>
                        {scratchedHorses.has(horse.id) && (
                          <span className="race-page__management-scratch-badge">
                            SCRATCHED
                          </span>
                        )}
                      </div>
                      <button
                        className={`race-page__management-scratch-btn ${
                          scratchedHorses.has(horse.id)
                            ? 'race-page__management-scratch-btn--unscratch'
                            : 'race-page__management-scratch-btn--scratch'
                        }`}
                        onClick={() => handleHorseScratch(horse.id, !scratchedHorses.has(horse.id))}
                      >
                        {scratchedHorses.has(horse.id) ? 'Unscratch' : 'Scratch'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}