import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function EditBet() {
  const { user, appUser } = useOutletContext();
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [selectedBet, setSelectedBet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingBets, setLoadingBets] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchFilters, setSearchFilters] = useState({
    username: '',
    eventId: '',
    raceId: ''
  });

  const [editData, setEditData] = useState({
    resolution: '',
    is_valid: true,
    invalid_reason: '',
    bet_winnings: ''
  });

  const [events, setEvents] = useState([]);
  const [races, setRaces] = useState([]);

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
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchFilters, bets]);

  useEffect(() => {
    if (selectedBet) {
      setEditData({
        resolution: selectedBet.resolution || '',
        is_valid: selectedBet.is_valid || true,
        invalid_reason: selectedBet.invalid_reason || '',
        bet_winnings: selectedBet.bet_winnings || ''
      });
    }
  }, [selectedBet]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadBets(),
        loadEvents(),
        loadRaces()
      ]);
    } catch (err) {
      setError('Error loading data: ' + err.message);
    } finally {
      setLoadingBets(false);
    }
  };

  const loadBets = async () => {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        app_users:playerId (username),
        events:eventId (event_name),
        races:raceId (race_number)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    setBets(data);
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('eventId, event_name')
      .order('event_name');

    if (error) throw error;
    setEvents(data);
  };

  const loadRaces = async () => {
    const { data, error } = await supabase
      .from('races')
      .select(`
        raceId,
        race_number,
        eventId,
        events:eventId (event_name)
      `)
      .order('race_number');

    if (error) throw error;
    setRaces(data);
  };

  const applyFilters = () => {
    let filtered = [...bets];

    if (searchFilters.username) {
      filtered = filtered.filter(bet =>
        bet.app_users?.username?.toLowerCase().includes(searchFilters.username.toLowerCase())
      );
    }

    if (searchFilters.eventId) {
      filtered = filtered.filter(bet => bet.eventId === searchFilters.eventId);
    }

    if (searchFilters.raceId) {
      filtered = filtered.filter(bet => bet.raceId === searchFilters.raceId);
    }

    setFilteredBets(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateEdit = () => {
    if (!editData.resolution) {
      setError('Resolution is required');
      return false;
    }

    if (!editData.is_valid && !editData.invalid_reason.trim()) {
      setError('Invalid reason is required when marking bet as invalid');
      return false;
    }

    if (editData.bet_winnings && isNaN(parseFloat(editData.bet_winnings))) {
      setError('Bet winnings must be a valid number');
      return false;
    }

    return true;
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccess('');

    if (!validateEdit()) {
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        resolution: editData.resolution,
        is_valid: editData.is_valid,
        invalid_reason: editData.is_valid ? null : editData.invalid_reason,
        bet_winnings: editData.bet_winnings ? parseFloat(editData.bet_winnings) : 0
      };

      const { error } = await supabase
        .from('bets')
        .update(updateData)
        .eq('betId', selectedBet.betId);

      if (error) throw error;

      setSuccess('Bet updated successfully');

      // Reload bets to reflect changes
      await loadBets();

      // Update selected bet with new data
      const updatedBet = { ...selectedBet, ...updateData };
      setSelectedBet(updatedBet);

    } catch (err) {
      setError('Error updating bet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      username: '',
      eventId: '',
      raceId: ''
    });
  };

  if (loadingBets) {
    return <div className="loading">Loading bets...</div>;
  }

  const availableRaces = searchFilters.eventId
    ? races.filter(race => race.eventId === searchFilters.eventId)
    : races;

  return (
    <div className="edit-bet-page">
      <h1>Edit Bet</h1>

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

      <div className="search-section">
        <h2>Search Bets</h2>

        <div className="search-filters">
          <div className="form-group">
            <label htmlFor="username">Player Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={searchFilters.username}
              onChange={handleFilterChange}
              placeholder="Search by username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventId">Event:</label>
            <select
              id="eventId"
              name="eventId"
              value={searchFilters.eventId}
              onChange={handleFilterChange}
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.event_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="raceId">Race:</label>
            <select
              id="raceId"
              name="raceId"
              value={searchFilters.raceId}
              onChange={handleFilterChange}
            >
              <option value="">All Races</option>
              {availableRaces.map((race) => (
                <option key={race.raceId} value={race.raceId}>
                  Race {race.race_number} - {race.events?.event_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bets-section">
        <h2>Search Results ({filteredBets.length} bets found)</h2>

        <div className="bets-list">
          {filteredBets.length === 0 ? (
            <p>No bets found matching the search criteria.</p>
          ) : (
            <table className="bets-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Player</th>
                  <th>Event</th>
                  <th>Race</th>
                  <th>Bet Type</th>
                  <th>Cost</th>
                  <th>Resolution</th>
                  <th>Winnings</th>
                  <th>Valid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBets.map((bet) => (
                  <tr key={bet.betId} className={selectedBet?.betId === bet.betId ? 'selected' : ''}>
                    <td>{new Date(bet.timestamp).toLocaleString()}</td>
                    <td>{bet.app_users?.username || 'Unknown'}</td>
                    <td>{bet.events?.event_name || 'Unknown'}</td>
                    <td>{bet.races?.race_number || 'Unknown'}</td>
                    <td>{bet.bet_type}</td>
                    <td>${bet.bet_cost.toFixed(2)}</td>
                    <td>{bet.resolution}</td>
                    <td>${bet.bet_winnings.toFixed(2)}</td>
                    <td>{bet.is_valid ? 'Yes' : 'No'}</td>
                    <td>
                      <button
                        onClick={() => setSelectedBet(bet)}
                        className="select-bet-button"
                      >
                        {selectedBet?.betId === bet.betId ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedBet && (
        <div className="edit-section">
          <h2>Edit Selected Bet</h2>

          <div className="bet-details">
            <h3>Bet Details</h3>
            <p><strong>Player:</strong> {selectedBet.app_users?.username}</p>
            <p><strong>Event:</strong> {selectedBet.events?.event_name}</p>
            <p><strong>Race:</strong> {selectedBet.races?.race_number}</p>
            <p><strong>Bet Type:</strong> {selectedBet.bet_type}</p>
            <p><strong>Bet Horses:</strong> {selectedBet.bet_horses}</p>
            <p><strong>Bet Cost:</strong> ${selectedBet.bet_cost.toFixed(2)}</p>
            <p><strong>Timestamp:</strong> {new Date(selectedBet.timestamp).toLocaleString()}</p>
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="resolution">Resolution:</label>
              <select
                id="resolution"
                name="resolution"
                value={editData.resolution}
                onChange={handleEditChange}
                disabled={loading}
              >
                <option value="">Select resolution</option>
                <option value="Unresolved">Unresolved</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Scratched">Scratched</option>
                <option value="Modified">Modified</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bet_winnings">Bet Winnings ($):</label>
              <input
                type="number"
                id="bet_winnings"
                name="bet_winnings"
                value={editData.bet_winnings}
                onChange={handleEditChange}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_valid"
                  checked={editData.is_valid}
                  onChange={handleEditChange}
                  disabled={loading}
                />
                Bet is Valid
              </label>
            </div>

            {!editData.is_valid && (
              <div className="form-group">
                <label htmlFor="invalid_reason">Invalid Reason:</label>
                <input
                  type="text"
                  id="invalid_reason"
                  name="invalid_reason"
                  value={editData.invalid_reason}
                  onChange={handleEditChange}
                  placeholder="Reason for marking bet as invalid"
                  maxLength={32}
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={() => setSelectedBet(null)}
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="audit-note">
        <h3>Audit Notice</h3>
        <p>All changes made to bets are logged for audit purposes. Use this functionality only for correcting errors or handling disputes.</p>
      </div>
    </div>
  );
}