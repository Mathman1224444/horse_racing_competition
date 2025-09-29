import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function MakeBet() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { user, appUser } = useOutletContext();
  const [race, setRace] = useState(null);
  const [event, setEvent] = useState(null);
  const [playerWallet, setPlayerWallet] = useState({
    race_wallet: 0,
    event_wallet: 0,
    winnings: 0
  });
  const [betType, setBetType] = useState('');
  const [betUnit, setBetUnit] = useState('');
  const [betHorses, setBetHorses] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (raceId && appUser) {
      loadRaceData();
    }
  }, [raceId, appUser]);

  const loadRaceData = async () => {
    try {
      setLoading(true);

      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('raceId', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('eventId', raceData.eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      await loadPlayerWallet(raceData.eventId);
    } catch (err) {
      setError('Error loading race data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerWallet = async (eventId) => {
    try {
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('bet_winnings')
        .eq('playerId', appUser.playerId)
        .eq('eventId', eventId);

      if (betsError) throw betsError;

      const totalWinnings = bets.reduce((sum, bet) => sum + (bet.bet_winnings || 0), 0);

      setPlayerWallet({
        race_wallet: 0, // This would need to be calculated based on your business logic
        event_wallet: 0, // This would need to be calculated based on your business logic
        winnings: totalWinnings
      });
    } catch (err) {
      console.error('Error loading player wallet:', err);
    }
  };

  const validateBet = () => {
    if (!betType) {
      setError('Please select a bet type');
      return false;
    }

    if (!betUnit || isNaN(betUnit) || parseFloat(betUnit) <= 0) {
      setError('Please enter a valid bet unit amount');
      return false;
    }

    if (!betHorses.trim()) {
      setError('Please specify the horses for your bet');
      return false;
    }

    // Check minimum bet amounts based on event settings
    const unit = parseFloat(betUnit);
    switch (betType.toLowerCase()) {
      case 'straight':
        if (unit < event.min_straight_bet) {
          setError(`Minimum straight bet is $${event.min_straight_bet}`);
          return false;
        }
        break;
      case 'exacta':
        if (unit < event.min_exacta_bet) {
          setError(`Minimum exacta bet is $${event.min_exacta_bet}`);
          return false;
        }
        break;
      case 'trifecta':
        if (unit < event.min_trifecta_bet) {
          setError(`Minimum trifecta bet is $${event.min_trifecta_bet}`);
          return false;
        }
        break;
      case 'superfecta':
        if (unit < event.min_superfecta_bet) {
          setError(`Minimum superfecta bet is $${event.min_superfecta_bet}`);
          return false;
        }
        break;
      case 'pick 2':
        if (unit < event.min_pick_2_bet) {
          setError(`Minimum pick 2 bet is $${event.min_pick_2_bet}`);
          return false;
        }
        break;
      case 'pick 3':
        if (unit < event.min_pick_3_bet) {
          setError(`Minimum pick 3 bet is $${event.min_pick_3_bet}`);
          return false;
        }
        break;
      case 'pick 4':
        if (unit < event.min_pick_4_bet) {
          setError(`Minimum pick 4 bet is $${event.min_pick_4_bet}`);
          return false;
        }
        break;
      case 'pick 5':
        if (unit < event.min_pick_5_bet) {
          setError(`Minimum pick 5 bet is $${event.min_pick_5_bet}`);
          return false;
        }
        break;
      case 'pick 6':
        if (unit < event.min_pick_6_bet) {
          setError(`Minimum pick 6 bet is $${event.min_pick_6_bet}`);
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateBet()) {
      return;
    }

    setSubmitting(true);

    try {
      const betCost = parseFloat(betUnit); // Simplified - would need more complex calculation for combinations

      const { data, error } = await supabase
        .from('bets')
        .insert([{
          playerId: appUser.playerId,
          raceId: raceId,
          eventId: race.eventId,
          resolution: 'Unresolved',
          is_valid: true,
          invalid_reason: null,
          bet_type: betType,
          bet_races: 1, // Simplified - would depend on bet type
          bet_unit: parseFloat(betUnit),
          bet_cost: betCost,
          bet_winnings: 0,
          is_boxed: false, // Would need UI control for this
          contains_wheel: false, // Would need UI control for this
          bet_horses: betHorses,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      navigate(`/race/${raceId}`);
    } catch (err) {
      setError('Error submitting bet: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading bet form...</div>;
  }

  if (error && !race) {
    return <div className="error">{error}</div>;
  }

  if (!race || !event) {
    return <div className="error">Race not found</div>;
  }

  return (
    <div className="make-bet-page">
      <h1>Make Bet</h1>

      <div className="race-info-section">
        <h2>Race Information</h2>
        <div className="race-details">
          <p><strong>Event:</strong> {event.event_name}</p>
          <p><strong>Race Number:</strong> {race.race_number}</p>
          <p><strong>Post Time:</strong> {new Date(race.post_time).toLocaleString()}</p>
        </div>
      </div>

      <div className="wallet-info-section">
        <h2>Your Wallet</h2>
        <div className="wallet-details">
          <p><strong>Race Wallet:</strong> ${playerWallet.race_wallet.toFixed(2)}</p>
          <p><strong>Event Wallet:</strong> ${playerWallet.event_wallet.toFixed(2)}</p>
          <p><strong>Total Winnings:</strong> ${playerWallet.winnings.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bet-form">
        <div className="form-group">
          <label htmlFor="betType">Bet Type:</label>
          <select
            id="betType"
            value={betType}
            onChange={(e) => setBetType(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">Select bet type</option>
            <option value="straight">Straight (Win/Place/Show)</option>
            <option value="exacta">Exacta</option>
            <option value="trifecta">Trifecta</option>
            <option value="superfecta">Superfecta</option>
            <option value="pick 2">Pick 2</option>
            <option value="pick 3">Pick 3</option>
            <option value="pick 4">Pick 4</option>
            <option value="pick 5">Pick 5</option>
            <option value="pick 6">Pick 6</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="betUnit">Bet Unit ($):</label>
          <input
            type="number"
            id="betUnit"
            value={betUnit}
            onChange={(e) => setBetUnit(e.target.value)}
            min="0"
            step="0.01"
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="betHorses">Bet Horses:</label>
          <input
            type="text"
            id="betHorses"
            value={betHorses}
            onChange={(e) => setBetHorses(e.target.value)}
            placeholder="e.g., 1-2-3 or 1,2,3"
            required
            disabled={submitting}
          />
          <small>Enter horse numbers separated by commas or dashes</small>
        </div>

        <div className="minimum-bets-info">
          <h3>Minimum Bet Amounts</h3>
          <ul>
            <li>Straight: ${event.min_straight_bet}</li>
            <li>Exacta: ${event.min_exacta_bet}</li>
            <li>Trifecta: ${event.min_trifecta_bet}</li>
            <li>Superfecta: ${event.min_superfecta_bet}</li>
            <li>Pick 2: ${event.min_pick_2_bet}</li>
            <li>Pick 3: ${event.min_pick_3_bet}</li>
            <li>Pick 4: ${event.min_pick_4_bet}</li>
            <li>Pick 5: ${event.min_pick_5_bet}</li>
            <li>Pick 6: ${event.min_pick_6_bet}</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/race/${raceId}`)}
            className="cancel-button"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-bet-button"
            disabled={submitting}
          >
            {submitting ? 'Submitting Bet...' : 'Submit Bet'}
          </button>
        </div>
      </form>
    </div>
  );
}