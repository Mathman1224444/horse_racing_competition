import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AddRace() {
  const navigate = useNavigate();
  const { user, appUser } = useOutletContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    eventId: '',
    race_number: '',
    post_time: '',
    num_horses: '',
    is_open_for_bets: true,
    is_resolved: false
  });

  // All users can access this page

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (formData.eventId) {
      calculateNextRaceNumber();
    }
  }, [formData.eventId]);

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

  const calculateNextRaceNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('race_number')
        .eq('eventId', formData.eventId)
        .order('race_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      const nextRaceNumber = data.length > 0 ? data[0].race_number + 1 : 1;
      setFormData(prev => ({
        ...prev,
        race_number: nextRaceNumber
      }));
    } catch (err) {
      console.error('Error calculating next race number:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.eventId) {
      setError('Please select an event');
      return false;
    }

    if (!formData.race_number || formData.race_number < 1) {
      setError('Race number must be 1 or greater');
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create the race
      const raceData = {
        eventId: formData.eventId,
        race_number: parseInt(formData.race_number),
        post_time: formData.post_time,
        num_horses: parseInt(formData.num_horses),
        is_open_for_bets: formData.is_open_for_bets,
        is_resolved: formData.is_resolved
      };

      const { data: raceResult, error: raceError } = await supabase
        .from('races')
        .insert([raceData])
        .select()
        .single();

      if (raceError) throw raceError;

      // Create the corresponding race results record with only raceId populated
      const { error: resultsError } = await supabase
        .from('race_results')
        .insert([{
          raceId: raceResult.raceId
        }]);

      if (resultsError) throw resultsError;

      navigate(`/race/${raceResult.raceId}`);
    } catch (err) {
      setError('Error creating race: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="add-race-page">
      <h1>Add New Race</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-race-form">
        <div className="form-group">
          <label htmlFor="eventId">Select Event:</label>
          <select
            id="eventId"
            name="eventId"
            value={formData.eventId}
            onChange={handleInputChange}
            required
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

        <div className="form-group">
          <label htmlFor="race_number">Race Number:</label>
          <input
            type="number"
            id="race_number"
            name="race_number"
            value={formData.race_number}
            onChange={handleInputChange}
            min="1"
            required
            disabled={loading}
          />
          <small>Auto-calculated based on existing races in the selected event</small>
        </div>

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
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Race...' : 'Create Race'}
          </button>
        </div>
      </form>

      <div className="info-note">
        <h3>Note:</h3>
        <p>When this race is created, a corresponding Race Results record will be automatically created with blank results. You can fill in the results later using the Edit Race Results page after the race is completed.</p>
      </div>
    </div>
  );
}