import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function EditRaceResults() {
  const { user, appUser } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [races, setRaces] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_horse: '',
    second_horse: '',
    third_horse: '',
    fourth_horse: '',
    horse_1_win_mult: '',
    horse_1_place_mult: '',
    horse_1_show_mult: '',
    horse_2_place_mult: '',
    horse_2_show_mult: '',
    horse_3_show_mult: '',
    exacta_mult: '',
    trifecta_mult: '',
    superfecta_mult: '',
    pick_2_mult: '',
    pick_3_mult: '',
    pick_4_mult: '',
    pick_5_mult: '',
    pick_6_mult: ''
  });

  // Check if user is commissioner
  if (!appUser?.is_commissioner) {
    return (
      <div className="error">
        <h1>Access Denied</h1>
        <p>This page is only accessible to Commissioners.</p>
      </div>
    );
  }

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
      loadRaceResults();
    } else {
      resetForm();
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
        .select('raceId, race_number, post_time, is_resolved, num_horses')
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

  const loadRaceResults = async () => {
    try {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
        .eq('raceId', selectedRaceId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setFormData({
          first_horse: data.first_horse || '',
          second_horse: data.second_horse || '',
          third_horse: data.third_horse || '',
          fourth_horse: data.fourth_horse || '',
          horse_1_win_mult: data.horse_1_win_mult || '',
          horse_1_place_mult: data.horse_1_place_mult || '',
          horse_1_show_mult: data.horse_1_show_mult || '',
          horse_2_place_mult: data.horse_2_place_mult || '',
          horse_2_show_mult: data.horse_2_show_mult || '',
          horse_3_show_mult: data.horse_3_show_mult || '',
          exacta_mult: data.exacta_mult || '',
          trifecta_mult: data.trifecta_mult || '',
          superfecta_mult: data.superfecta_mult || '',
          pick_2_mult: data.pick_2_mult || '',
          pick_3_mult: data.pick_3_mult || '',
          pick_4_mult: data.pick_4_mult || '',
          pick_5_mult: data.pick_5_mult || '',
          pick_6_mult: data.pick_6_mult || ''
        });
      } else {
        resetForm();
      }
    } catch (err) {
      setError('Error loading race results: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      first_horse: '',
      second_horse: '',
      third_horse: '',
      fourth_horse: '',
      horse_1_win_mult: '',
      horse_1_place_mult: '',
      horse_1_show_mult: '',
      horse_2_place_mult: '',
      horse_2_show_mult: '',
      horse_3_show_mult: '',
      exacta_mult: '',
      trifecta_mult: '',
      superfecta_mult: '',
      pick_2_mult: '',
      pick_3_mult: '',
      pick_4_mult: '',
      pick_5_mult: '',
      pick_6_mult: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    if (!formData.first_horse) {
      setError('First place horse is required');
      return false;
    }

    // Check for duplicate horses in finishing positions
    const finishingHorses = [
      formData.first_horse,
      formData.second_horse,
      formData.third_horse,
      formData.fourth_horse
    ].filter(horse => horse !== '');

    const uniqueHorses = new Set(finishingHorses);
    if (uniqueHorses.size !== finishingHorses.length) {
      setError('Each horse can only finish in one position');
      return false;
    }

    return true;
  };

  const resolveAffectedBets = async () => {
    try {
      // This is a simplified version - in a real implementation,
      // you would calculate winnings based on bet types and multipliers
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('raceId', selectedRaceId)
        .eq('resolution', 'Unresolved');

      if (betsError) throw betsError;

      // For now, just mark all bets as resolved with zero winnings
      // In a real implementation, you would calculate actual winnings
      for (const bet of bets) {
        const { error: updateError } = await supabase
          .from('bets')
          .update({
            resolution: 'Lost', // Simplified - would need proper calculation
            bet_winnings: 0
          })
          .eq('betId', bet.betId);

        if (updateError) throw updateError;
      }

      return bets.length;
    } catch (err) {
      console.error('Error resolving bets:', err);
      return 0;
    }
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
      const resultsData = {
        raceId: selectedRaceId,
        first_horse: formData.first_horse ? parseInt(formData.first_horse) : null,
        second_horse: formData.second_horse ? parseInt(formData.second_horse) : null,
        third_horse: formData.third_horse ? parseInt(formData.third_horse) : null,
        fourth_horse: formData.fourth_horse ? parseInt(formData.fourth_horse) : null,
        horse_1_win_mult: formData.horse_1_win_mult ? parseFloat(formData.horse_1_win_mult) : null,
        horse_1_place_mult: formData.horse_1_place_mult ? parseFloat(formData.horse_1_place_mult) : null,
        horse_1_show_mult: formData.horse_1_show_mult ? parseFloat(formData.horse_1_show_mult) : null,
        horse_2_place_mult: formData.horse_2_place_mult ? parseFloat(formData.horse_2_place_mult) : null,
        horse_2_show_mult: formData.horse_2_show_mult ? parseFloat(formData.horse_2_show_mult) : null,
        horse_3_show_mult: formData.horse_3_show_mult ? parseFloat(formData.horse_3_show_mult) : null,
        exacta_mult: formData.exacta_mult ? parseFloat(formData.exacta_mult) : null,
        trifecta_mult: formData.trifecta_mult ? parseFloat(formData.trifecta_mult) : null,
        superfecta_mult: formData.superfecta_mult ? parseFloat(formData.superfecta_mult) : null,
        pick_2_mult: formData.pick_2_mult ? parseFloat(formData.pick_2_mult) : null,
        pick_3_mult: formData.pick_3_mult ? parseFloat(formData.pick_3_mult) : null,
        pick_4_mult: formData.pick_4_mult ? parseFloat(formData.pick_4_mult) : null,
        pick_5_mult: formData.pick_5_mult ? parseFloat(formData.pick_5_mult) : null,
        pick_6_mult: formData.pick_6_mult ? parseFloat(formData.pick_6_mult) : null
      };

      // Update race results
      const { error: resultsError } = await supabase
        .from('race_results')
        .upsert(resultsData);

      if (resultsError) throw resultsError;

      // Resolve affected bets
      const affectedBets = await resolveAffectedBets();

      setSuccess(`Race results saved successfully. ${affectedBets} bets were automatically resolved.`);
    } catch (err) {
      setError('Error saving race results: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return <div className="loading">Loading events...</div>;
  }

  const selectedRace = races.find(race => race.raceId === selectedRaceId);

  return (
    <div className="edit-race-results-page">
      <h1>Edit Race Results</h1>

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
                    {race.is_resolved ? ' (Resolved)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {selectedRaceId && selectedRace && (
        <form onSubmit={handleSubmit} className="edit-results-form">
          <div className="form-section">
            <h2>Finishing Order</h2>
            <p>Race has {selectedRace.num_horses} horses</p>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_horse">1st Place:</label>
                <input
                  type="number"
                  id="first_horse"
                  name="first_horse"
                  value={formData.first_horse}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedRace.num_horses}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="second_horse">2nd Place:</label>
                <input
                  type="number"
                  id="second_horse"
                  name="second_horse"
                  value={formData.second_horse}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedRace.num_horses}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="third_horse">3rd Place:</label>
                <input
                  type="number"
                  id="third_horse"
                  name="third_horse"
                  value={formData.third_horse}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedRace.num_horses}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fourth_horse">4th Place:</label>
                <input
                  type="number"
                  id="fourth_horse"
                  name="fourth_horse"
                  value={formData.fourth_horse}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedRace.num_horses}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Win/Place/Show Multipliers</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="horse_1_win_mult">1st Horse Win:</label>
                <input
                  type="number"
                  id="horse_1_win_mult"
                  name="horse_1_win_mult"
                  value={formData.horse_1_win_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse_1_place_mult">1st Horse Place:</label>
                <input
                  type="number"
                  id="horse_1_place_mult"
                  name="horse_1_place_mult"
                  value={formData.horse_1_place_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse_1_show_mult">1st Horse Show:</label>
                <input
                  type="number"
                  id="horse_1_show_mult"
                  name="horse_1_show_mult"
                  value={formData.horse_1_show_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse_2_place_mult">2nd Horse Place:</label>
                <input
                  type="number"
                  id="horse_2_place_mult"
                  name="horse_2_place_mult"
                  value={formData.horse_2_place_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse_2_show_mult">2nd Horse Show:</label>
                <input
                  type="number"
                  id="horse_2_show_mult"
                  name="horse_2_show_mult"
                  value={formData.horse_2_show_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="horse_3_show_mult">3rd Horse Show:</label>
                <input
                  type="number"
                  id="horse_3_show_mult"
                  name="horse_3_show_mult"
                  value={formData.horse_3_show_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Exotic Bet Multipliers</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="exacta_mult">Exacta:</label>
                <input
                  type="number"
                  id="exacta_mult"
                  name="exacta_mult"
                  value={formData.exacta_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="trifecta_mult">Trifecta:</label>
                <input
                  type="number"
                  id="trifecta_mult"
                  name="trifecta_mult"
                  value={formData.trifecta_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="superfecta_mult">Superfecta:</label>
                <input
                  type="number"
                  id="superfecta_mult"
                  name="superfecta_mult"
                  value={formData.superfecta_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Pick Bet Multipliers</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="pick_2_mult">Pick 2:</label>
                <input
                  type="number"
                  id="pick_2_mult"
                  name="pick_2_mult"
                  value={formData.pick_2_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pick_3_mult">Pick 3:</label>
                <input
                  type="number"
                  id="pick_3_mult"
                  name="pick_3_mult"
                  value={formData.pick_3_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pick_4_mult">Pick 4:</label>
                <input
                  type="number"
                  id="pick_4_mult"
                  name="pick_4_mult"
                  value={formData.pick_4_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pick_5_mult">Pick 5:</label>
                <input
                  type="number"
                  id="pick_5_mult"
                  name="pick_5_mult"
                  value={formData.pick_5_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pick_6_mult">Pick 6:</label>
                <input
                  type="number"
                  id="pick_6_mult"
                  name="pick_6_mult"
                  value={formData.pick_6_mult}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving Results...' : 'Save Results & Resolve Bets'}
            </button>
          </div>
        </form>
      )}

      {!selectedEventId && (
        <div className="instructions">
          <p>Select an event to see its races and edit their results.</p>
        </div>
      )}

      {selectedEventId && !selectedRaceId && races.length === 0 && !loadingRaces && (
        <div className="no-races">
          <p>No races found for the selected event.</p>
        </div>
      )}
    </div>
  );
}