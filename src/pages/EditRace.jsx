import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function EditRace() {
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
    post_time: '',
    num_horses: '',
    is_open_for_bets: false,
    is_resolved: false
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
      loadRaceDetails();
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
        .select('raceId, race_number, post_time, is_resolved')
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

  const loadRaceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('raceId', selectedRaceId)
        .single();

      if (error) throw error;

      setFormData({
        post_time: data.post_time ? new Date(data.post_time).toISOString().slice(0, 16) : '',
        num_horses: data.num_horses || '',
        is_open_for_bets: data.is_open_for_bets || false,
        is_resolved: data.is_resolved || false
      });
    } catch (err) {
      setError('Error loading race details: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      post_time: '',
      num_horses: '',
      is_open_for_bets: false,
      is_resolved: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.post_time) {
      setError('Post time is required');
      return false;
    }

    if (!formData.num_horses || formData.num_horses < 2) {
      setError('Number of horses must be 2 or greater');
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
      const updateData = {
        post_time: formData.post_time,
        num_horses: parseInt(formData.num_horses),
        is_open_for_bets: formData.is_open_for_bets,
        is_resolved: formData.is_resolved
      };

      const { error } = await supabase
        .from('races')
        .update(updateData)
        .eq('raceId', selectedRaceId);

      if (error) throw error;

      setSuccess('Race updated successfully');

      // Reload races to reflect any changes
      await loadRaces();
    } catch (err) {
      setError('Error updating race: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="edit-race-page">
      <h1>Edit Race</h1>

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

      {selectedRaceId && (
        <form onSubmit={handleSubmit} className="edit-race-form">
          <div className="form-group">
            <label htmlFor="post_time">Post Time:</label>
            <input
              type="datetime-local"
              id="post_time"
              name="post_time"
              value={formData.post_time}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="num_horses">Number of Horses:</label>
            <input
              type="number"
              id="num_horses"
              name="num_horses"
              value={formData.num_horses}
              onChange={handleInputChange}
              min="2"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_open_for_bets"
                checked={formData.is_open_for_bets}
                onChange={handleInputChange}
                disabled={loading}
              />
              Open for Bets
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_resolved"
                checked={formData.is_resolved}
                onChange={handleInputChange}
                disabled={loading}
              />
              Race Resolved
            </label>
            {formData.is_resolved && (
              <small className="warning">
                ⚠️ Warning: Marking a race as resolved will trigger payout calculations for all bets.
              </small>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Updating Race...' : 'Update Race'}
            </button>
          </div>
        </form>
      )}

      {!selectedEventId && (
        <div className="instructions">
          <p>Select an event to see its races and edit their details.</p>
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