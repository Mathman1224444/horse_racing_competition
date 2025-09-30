import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AddScratch() {
  const { user, appUser } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [races, setRaces] = useState([]);
  const [scratches, setScratches] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [horseNum, setHorseNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [loadingScratches, setLoadingScratches] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [affectedBetsCount, setAffectedBetsCount] = useState(0);

  // All users can access this page

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRaces();
    } else {
      setRaces([]);
      setSelectedRaceId('');
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedRaceId) {
      loadScratches();
    } else {
      setScratches([]);
    }
  }, [selectedRaceId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('eventId, event_name, location, date')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data);
    } catch (err) {
      setError('Error loading events: ' + err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadRaces = async () => {
    setLoadingRaces(true);
    try {
      const { data, error } = await supabase
        .from('races')
        .select('raceId, race_number, post_time, num_horses, is_resolved')
        .eq('eventId', selectedEventId)
        .order('race_number', { ascending: true });

      if (error) throw error;
      setRaces(data);
    } catch (err) {
      setError('Error loading races: ' + err.message);
    } finally {
      setLoadingRaces(false);
    }
  };

  const loadScratches = async () => {
    setLoadingScratches(true);
    try {
      const { data, error } = await supabase
        .from('scratches')
        .select('scratchId, horse_num')
        .eq('raceId', selectedRaceId)
        .order('horse_num', { ascending: true });

      if (error) throw error;
      setScratches(data);
    } catch (err) {
      setError('Error loading scratches: ' + err.message);
    } finally {
      setLoadingScratches(false);
    }
  };

  const checkAffectedBets = async (raceId, horseNumber) => {
    try {
      // This is a simplified check - in reality, you'd need to parse bet_horses
      // and check if the scratched horse affects each bet
      const { data, error } = await supabase
        .from('bets')
        .select('betId, bet_horses')
        .eq('raceId', raceId)
        .eq('resolution', 'Unresolved');

      if (error) throw error;

      // Simple check if horse number appears in bet_horses string
      const affectedBets = data.filter(bet =>
        bet.bet_horses.includes(horseNumber.toString())
      );

      return affectedBets.length;
    } catch (err) {
      console.error('Error checking affected bets:', err);
      return 0;
    }
  };

  const markAffectedBetsAsScratched = async (raceId, horseNumber) => {
    try {
      // Get all unresolved bets for this race
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('betId, bet_horses')
        .eq('raceId', raceId)
        .eq('resolution', 'Unresolved');

      if (betsError) throw betsError;

      // Filter bets that include the scratched horse
      const affectedBets = bets.filter(bet =>
        bet.bet_horses.includes(horseNumber.toString())
      );

      // Update affected bets to 'Scratched' status
      for (const bet of affectedBets) {
        const { error: updateError } = await supabase
          .from('bets')
          .update({
            resolution: 'Scratched',
            bet_winnings: 0
          })
          .eq('betId', bet.betId);

        if (updateError) throw updateError;
      }

      return affectedBets.length;
    } catch (err) {
      console.error('Error marking bets as scratched:', err);
      return 0;
    }
  };

  const validateForm = () => {
    if (!selectedEventId) {
      setError('Please select an event');
      return false;
    }

    if (!selectedRaceId) {
      setError('Please select a race');
      return false;
    }

    if (!horseNum || isNaN(parseInt(horseNum))) {
      setError('Please enter a valid horse number');
      return false;
    }

    const selectedRace = races.find(race => race.raceId === selectedRaceId);
    if (!selectedRace) {
      setError('Selected race not found');
      return false;
    }

    const horseNumber = parseInt(horseNum);
    if (horseNumber < 1 || horseNumber > selectedRace.num_horses) {
      setError(`Horse number must be between 1 and ${selectedRace.num_horses}`);
      return false;
    }

    // Check if horse is already scratched
    const alreadyScratched = scratches.some(scratch => scratch.horse_num === horseNumber);
    if (alreadyScratched) {
      setError(`Horse ${horseNumber} is already scratched from this race`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const horseNumber = parseInt(horseNum);

      // Check how many bets will be affected
      const affectedCount = await checkAffectedBets(selectedRaceId, horseNumber);
      setAffectedBetsCount(affectedCount);

      // Add the scratch
      const { error: scratchError } = await supabase
        .from('scratches')
        .insert([{
          raceId: selectedRaceId,
          horse_num: horseNumber
        }]);

      if (scratchError) throw scratchError;

      // Mark affected bets as scratched
      const actualAffectedCount = await markAffectedBetsAsScratched(selectedRaceId, horseNumber);

      setSuccess(
        `Horse ${horseNumber} has been scratched successfully. ` +
        `${actualAffectedCount} bet(s) were automatically marked as 'Scratched'.`
      );

      // Reset form and reload scratches
      setHorseNum('');
      await loadScratches();

    } catch (err) {
      setError('Error adding scratch: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveScratch = async (scratchId, horseNumber) => {
    if (!window.confirm(`Are you sure you want to remove the scratch for Horse ${horseNumber}?`)) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('scratches')
        .delete()
        .eq('scratchId', scratchId);

      if (error) throw error;

      setSuccess(`Scratch removed for Horse ${horseNumber}`);
      await loadScratches();

    } catch (err) {
      setError('Error removing scratch: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return <div className="loading">Loading events...</div>;
  }

  const selectedRace = races.find(race => race.raceId === selectedRaceId);

  return (
    <div className="add-scratch-page">
      <h1>Add Scratch</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="selection-section">
        <div className="form-group">
          <label htmlFor="eventSelect">Select Event:</label>
          <select
            id="eventSelect"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={loading}
          >
            <option value="">Choose an event</option>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.event_name} - {event.location} ({new Date(event.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <div className="form-group">
            <label htmlFor="raceSelect">Select Race:</label>
            {loadingRaces ? (
              <div className="loading-small">Loading races...</div>
            ) : (
              <select
                id="raceSelect"
                value={selectedRaceId}
                onChange={(e) => setSelectedRaceId(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose a race</option>
                {races.map((race) => (
                  <option key={race.raceId} value={race.raceId}>
                    Race {race.race_number} - {new Date(race.post_time).toLocaleString()}
                    {race.is_resolved ? ' (Resolved)' : ''} - {race.num_horses} horses
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {selectedRaceId && selectedRace && (
        <div className="scratch-section">
          <h2>Add New Scratch for Race {selectedRace.race_number}</h2>
          <p>This race has {selectedRace.num_horses} horses (1-{selectedRace.num_horses})</p>

          <form onSubmit={handleSubmit} className="scratch-form">
            <div className="form-group">
              <label htmlFor="horseNum">Horse Number to Scratch:</label>
              <input
                type="number"
                id="horseNum"
                value={horseNum}
                onChange={(e) => setHorseNum(e.target.value)}
                min="1"
                max={selectedRace.num_horses}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="add-scratch-button"
              disabled={loading}
            >
              {loading ? 'Adding Scratch...' : 'Add Scratch'}
            </button>
          </form>
        </div>
      )}

      {selectedRaceId && (
        <div className="existing-scratches-section">
          <h2>Existing Scratches</h2>

          {loadingScratches ? (
            <div className="loading-small">Loading scratches...</div>
          ) : scratches.length === 0 ? (
            <p>No horses are currently scratched from this race.</p>
          ) : (
            <div className="scratches-list">
              <table className="scratches-table">
                <thead>
                  <tr>
                    <th>Horse Number</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scratches.map((scratch) => (
                    <tr key={scratch.scratchId}>
                      <td>Horse {scratch.horse_num}</td>
                      <td>
                        <button
                          onClick={() => handleRemoveScratch(scratch.scratchId, scratch.horse_num)}
                          className="remove-scratch-button"
                          disabled={loading}
                        >
                          Remove Scratch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedEventId && (
        <div className="instructions">
          <p>Select an event to see its races and manage scratches.</p>
        </div>
      )}

      {selectedEventId && !selectedRaceId && races.length === 0 && !loadingRaces && (
        <div className="no-races">
          <p>No races found for the selected event.</p>
        </div>
      )}

      <div className="info-section">
        <h3>Important Notes</h3>
        <ul>
          <li>When a horse is scratched, all bets that include that horse will be automatically marked as 'Scratched'</li>
          <li>Scratched bets will have their winnings set to $0.00</li>
          <li>You will see a confirmation showing how many bets were affected</li>
          <li>Scratches can be removed if added by mistake, but bet statuses won't be automatically reverted</li>
        </ul>
      </div>
    </div>
  );
}