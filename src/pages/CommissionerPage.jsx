import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function CommissionerPage() {
  const { user, appUser } = useOutletContext();
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [races, setRaces] = useState([]);

  // Event creation state
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    event_date: '',
    description: ''
  });

  // Race creation state
  const [newRace, setNewRace] = useState({
    name: '',
    event_id: '',
    track: '',
    start_time: '',
    distance: '',
    prize_pool: '',
    race_type: 'Standard',
    surface: 'Dirt'
  });

  // Race results state
  const [selectedRace, setSelectedRace] = useState('');
  const [raceHorses, setRaceHorses] = useState([]);
  const [finishingOrder, setFinishingOrder] = useState([]);

  useEffect(() => {
    loadEvents();
    loadRaces();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    }
  };

  const loadRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('*, events(name)')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setRaces(data || []);
    } catch (err) {
      console.error('Error loading races:', err);
      setError('Failed to load races');
    }
  };

  const loadRaceHorses = async (raceId) => {
    try {
      const { data, error } = await supabase
        .from('horses')
        .select('*')
        .eq('race_id', raceId)
        .order('program_number', { ascending: true });

      if (error) throw error;
      setRaceHorses(data || []);
    } catch (err) {
      console.error('Error loading race horses:', err);
      setError('Failed to load race horses');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: newEvent.name,
          location: newEvent.location,
          event_date: newEvent.event_date,
          description: newEvent.description
        }])
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [data, ...prev]);
      setNewEvent({
        name: '',
        location: '',
        event_date: '',
        description: ''
      });
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRace = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('races')
        .insert([{
          name: newRace.name,
          event_id: newRace.event_id,
          track: newRace.track,
          start_time: newRace.start_time,
          distance: newRace.distance,
          prize_pool: newRace.prize_pool ? Number(newRace.prize_pool) : null,
          race_type: newRace.race_type,
          surface: newRace.surface,
          status: 'upcoming'
        }])
        .select()
        .single();

      if (error) throw error;

      await loadRaces();
      setNewRace({
        name: '',
        event_id: '',
        track: '',
        start_time: '',
        distance: '',
        prize_pool: '',
        race_type: 'Standard',
        surface: 'Dirt'
      });
    } catch (err) {
      console.error('Error creating race:', err);
      setError('Failed to create race');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRaceResults = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('races')
        .update({
          finishing_order: finishingOrder,
          status: 'finished'
        })
        .eq('id', selectedRace);

      if (error) throw error;

      await loadRaces();
      setSelectedRace('');
      setFinishingOrder([]);
      setRaceHorses([]);
    } catch (err) {
      console.error('Error setting race results:', err);
      setError('Failed to set race results');
    } finally {
      setLoading(false);
    }
  };

  const handleRaceSelection = (raceId) => {
    setSelectedRace(raceId);
    if (raceId) {
      loadRaceHorses(raceId);
    } else {
      setRaceHorses([]);
      setFinishingOrder([]);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="commissioner-page">
      <div className="commissioner-page__header">
        <h1>Event & Race Management</h1>
        <p>Create events, manage races, and set race results</p>
      </div>

      {error && (
        <div className="commissioner-page__error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="commissioner-page__tabs">
        <button
          className={`commissioner-page__tab ${
            activeTab === 'events' ? 'commissioner-page__tab--active' : ''
          }`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={`commissioner-page__tab ${
            activeTab === 'races' ? 'commissioner-page__tab--active' : ''
          }`}
          onClick={() => setActiveTab('races')}
        >
          Races
        </button>
        <button
          className={`commissioner-page__tab ${
            activeTab === 'results' ? 'commissioner-page__tab--active' : ''
          }`}
          onClick={() => setActiveTab('results')}
        >
          Race Results
        </button>
      </div>

      <div className="commissioner-page__content">
        {activeTab === 'events' && (
          <div className="commissioner-page__section">
            <h2>Event Management</h2>

            <div className="commissioner-page__subsection">
              <h3>Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="commissioner-page__form">
                <div className="commissioner-page__form-grid">
                  <label className="commissioner-page__label">
                    Event Name *
                    <input
                      type="text"
                      className="commissioner-page__input"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Location *
                    <input
                      type="text"
                      className="commissioner-page__input"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Event Date *
                    <input
                      type="date"
                      className="commissioner-page__input"
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Description
                    <textarea
                      className="commissioner-page__textarea"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      disabled={loading}
                      rows="3"
                    />
                  </label>
                </div>

                <button type="submit" className="commissioner-page__button" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </div>

            <div className="commissioner-page__subsection">
              <h3>Existing Events</h3>
              <div className="commissioner-page__items">
                {events.length === 0 ? (
                  <p>No events created yet.</p>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="commissioner-page__item-card">
                      <h4>{event.name}</h4>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
                      {event.description && (
                        <p><strong>Description:</strong> {event.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'races' && (
          <div className="commissioner-page__section">
            <h2>Race Management</h2>

            <div className="commissioner-page__subsection">
              <h3>Create New Race</h3>
              <form onSubmit={handleCreateRace} className="commissioner-page__form">
                <div className="commissioner-page__form-grid">
                  <label className="commissioner-page__label">
                    Race Name *
                    <input
                      type="text"
                      className="commissioner-page__input"
                      value={newRace.name}
                      onChange={(e) => setNewRace(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Event *
                    <select
                      className="commissioner-page__select"
                      value={newRace.event_id}
                      onChange={(e) => setNewRace(prev => ({ ...prev, event_id: e.target.value }))}
                      required
                      disabled={loading}
                    >
                      <option value="">Select an event</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.name} - {new Date(event.event_date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="commissioner-page__label">
                    Track
                    <input
                      type="text"
                      className="commissioner-page__input"
                      value={newRace.track}
                      onChange={(e) => setNewRace(prev => ({ ...prev, track: e.target.value }))}
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Start Time *
                    <input
                      type="datetime-local"
                      className="commissioner-page__input"
                      value={newRace.start_time}
                      onChange={(e) => setNewRace(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Distance
                    <input
                      type="text"
                      className="commissioner-page__input"
                      value={newRace.distance}
                      onChange={(e) => setNewRace(prev => ({ ...prev, distance: e.target.value }))}
                      placeholder="e.g., 1 mile, 6 furlongs"
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Prize Pool ($)
                    <input
                      type="number"
                      className="commissioner-page__input"
                      value={newRace.prize_pool}
                      onChange={(e) => setNewRace(prev => ({ ...prev, prize_pool: e.target.value }))}
                      min="0"
                      step="100"
                      disabled={loading}
                    />
                  </label>

                  <label className="commissioner-page__label">
                    Race Type
                    <select
                      className="commissioner-page__select"
                      value={newRace.race_type}
                      onChange={(e) => setNewRace(prev => ({ ...prev, race_type: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Stakes">Stakes</option>
                      <option value="Handicap">Handicap</option>
                      <option value="Maiden">Maiden</option>
                    </select>
                  </label>

                  <label className="commissioner-page__label">
                    Surface
                    <select
                      className="commissioner-page__select"
                      value={newRace.surface}
                      onChange={(e) => setNewRace(prev => ({ ...prev, surface: e.target.value }))}
                      disabled={loading}
                    >
                      <option value="Dirt">Dirt</option>
                      <option value="Turf">Turf</option>
                      <option value="Synthetic">Synthetic</option>
                    </select>
                  </label>
                </div>

                <button type="submit" className="commissioner-page__button" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Race'}
                </button>
              </form>
            </div>

            <div className="commissioner-page__subsection">
              <h3>Existing Races</h3>
              <div className="commissioner-page__items">
                {races.length === 0 ? (
                  <p>No races created yet.</p>
                ) : (
                  races.map(race => (
                    <div key={race.id} className="commissioner-page__item-card">
                      <h4>{race.name}</h4>
                      <p><strong>Event:</strong> {race.events?.name}</p>
                      <p><strong>Start:</strong> {formatDateTime(race.start_time)}</p>
                      <p><strong>Status:</strong> {race.status}</p>
                      {race.track && <p><strong>Track:</strong> {race.track}</p>}
                      {race.prize_pool && <p><strong>Prize Pool:</strong> ${race.prize_pool.toLocaleString()}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="commissioner-page__section">
            <h2>Race Results Management</h2>

            <form onSubmit={handleSetRaceResults} className="commissioner-page__form">
              <label className="commissioner-page__label">
                Select Race *
                <select
                  className="commissioner-page__select"
                  value={selectedRace}
                  onChange={(e) => handleRaceSelection(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select a race</option>
                  {races.filter(race => race.status !== 'finished').map(race => (
                    <option key={race.id} value={race.id}>
                      {race.name} - {formatDateTime(race.start_time)}
                    </option>
                  ))}
                </select>
              </label>

              {raceHorses.length > 0 && (
                <div className="commissioner-page__results-section">
                  <h3>Set Finishing Order</h3>
                  <p>Drag horses to reorder, or click to add/remove from finishing order:</p>

                  <div className="commissioner-page__horses-grid">
                    {raceHorses.map(horse => (
                      <div
                        key={horse.id}
                        className={`commissioner-page__horse-card ${
                          finishingOrder.includes(horse.id) ? 'commissioner-page__horse-card--selected' : ''
                        }`}
                        onClick={() => {
                          if (finishingOrder.includes(horse.id)) {
                            setFinishingOrder(prev => prev.filter(id => id !== horse.id));
                          } else {
                            setFinishingOrder(prev => [...prev, horse.id]);
                          }
                        }}
                      >
                        <span className="commissioner-page__horse-number">#{horse.program_number}</span>
                        <span className="commissioner-page__horse-name">{horse.name}</span>
                        {finishingOrder.includes(horse.id) && (
                          <span className="commissioner-page__finishing-position">
                            {finishingOrder.indexOf(horse.id) + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {finishingOrder.length > 0 && (
                    <div className="commissioner-page__finishing-order">
                      <h4>Finishing Order:</h4>
                      <ol>
                        {finishingOrder.map(horseId => {
                          const horse = raceHorses.find(h => h.id === horseId);
                          return (
                            <li key={horseId}>
                              #{horse?.program_number} {horse?.name}
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {selectedRace && raceHorses.length > 0 && (
                <button type="submit" className="commissioner-page__button" disabled={loading || finishingOrder.length === 0}>
                  {loading ? 'Setting Results...' : 'Set Race Results'}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}