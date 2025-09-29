import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AddEvent() {
  const navigate = useNavigate();
  const { user, appUser } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    location: '',
    date: '',
    event_name: '',
    num_races: '',
    current_race_num: 1,
    event_wallet_per_player: '',
    race_wallet_per_player: '',
    can_rebet_winnings: true,
    can_bet_future_race: true,
    min_bets_per_race: '',
    max_bets_per_race: '',
    first_prize: '',
    second_prize: '',
    third_prize: '',
    min_straight_bet: '',
    min_exacta_bet: '',
    min_trifecta_bet: '',
    min_superfecta_bet: '',
    min_pick_2_bet: '',
    min_pick_3_bet: '',
    min_pick_4_bet: '',
    min_pick_5_bet: '',
    min_pick_6_bet: ''
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const required = [
      'location', 'date', 'event_name', 'num_races', 'event_wallet_per_player',
      'race_wallet_per_player', 'min_bets_per_race', 'max_bets_per_race',
      'first_prize', 'second_prize', 'third_prize', 'min_straight_bet',
      'min_exacta_bet', 'min_trifecta_bet', 'min_superfecta_bet',
      'min_pick_2_bet', 'min_pick_3_bet', 'min_pick_4_bet',
      'min_pick_5_bet', 'min_pick_6_bet'
    ];

    for (const field of required) {
      if (!formData[field] || formData[field] === '') {
        setError(`${field.replace(/_/g, ' ')} is required`);
        return false;
      }
    }

    if (parseInt(formData.min_bets_per_race) > parseInt(formData.max_bets_per_race)) {
      setError('Minimum bets per race cannot be greater than maximum bets per race');
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
      const eventData = {
        ...formData,
        num_races: parseInt(formData.num_races),
        current_race_num: parseInt(formData.current_race_num),
        event_wallet_per_player: parseFloat(formData.event_wallet_per_player),
        race_wallet_per_player: parseFloat(formData.race_wallet_per_player),
        min_bets_per_race: parseInt(formData.min_bets_per_race),
        max_bets_per_race: parseInt(formData.max_bets_per_race),
        first_prize: parseFloat(formData.first_prize),
        second_prize: parseFloat(formData.second_prize),
        third_prize: parseFloat(formData.third_prize),
        min_straight_bet: parseFloat(formData.min_straight_bet),
        min_exacta_bet: parseFloat(formData.min_exacta_bet),
        min_trifecta_bet: parseFloat(formData.min_trifecta_bet),
        min_superfecta_bet: parseFloat(formData.min_superfecta_bet),
        min_pick_2_bet: parseFloat(formData.min_pick_2_bet),
        min_pick_3_bet: parseFloat(formData.min_pick_3_bet),
        min_pick_4_bet: parseFloat(formData.min_pick_4_bet),
        min_pick_5_bet: parseFloat(formData.min_pick_5_bet),
        min_pick_6_bet: parseFloat(formData.min_pick_6_bet)
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      navigate(`/event/${data.eventId}`);
    } catch (err) {
      setError('Error creating event: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-event-page">
      <h1>Add New Event</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-event-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="event_name">Event Name:</label>
            <input
              type="text"
              id="event_name"
              name="event_name"
              value={formData.event_name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="num_races">Number of Races:</label>
            <input
              type="number"
              id="num_races"
              name="num_races"
              value={formData.num_races}
              onChange={handleInputChange}
              min="1"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Wallet Configuration</h2>

          <div className="form-group">
            <label htmlFor="event_wallet_per_player">Event Wallet Per Player ($):</label>
            <input
              type="number"
              id="event_wallet_per_player"
              name="event_wallet_per_player"
              value={formData.event_wallet_per_player}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="race_wallet_per_player">Race Wallet Per Player ($):</label>
            <input
              type="number"
              id="race_wallet_per_player"
              name="race_wallet_per_player"
              value={formData.race_wallet_per_player}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Prize Configuration</h2>

          <div className="form-group">
            <label htmlFor="first_prize">First Prize ($):</label>
            <input
              type="number"
              id="first_prize"
              name="first_prize"
              value={formData.first_prize}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="second_prize">Second Prize ($):</label>
            <input
              type="number"
              id="second_prize"
              name="second_prize"
              value={formData.second_prize}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="third_prize">Third Prize ($):</label>
            <input
              type="number"
              id="third_prize"
              name="third_prize"
              value={formData.third_prize}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Betting Rules</h2>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="can_rebet_winnings"
                checked={formData.can_rebet_winnings}
                onChange={handleInputChange}
                disabled={loading}
              />
              Can Rebet Winnings
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="can_bet_future_race"
                checked={formData.can_bet_future_race}
                onChange={handleInputChange}
                disabled={loading}
              />
              Can Bet Future Races
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="min_bets_per_race">Minimum Bets Per Race:</label>
            <input
              type="number"
              id="min_bets_per_race"
              name="min_bets_per_race"
              value={formData.min_bets_per_race}
              onChange={handleInputChange}
              min="0"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="max_bets_per_race">Maximum Bets Per Race:</label>
            <input
              type="number"
              id="max_bets_per_race"
              name="max_bets_per_race"
              value={formData.max_bets_per_race}
              onChange={handleInputChange}
              min="0"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Minimum Bet Amounts</h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="min_straight_bet">Straight Bet ($):</label>
              <input
                type="number"
                id="min_straight_bet"
                name="min_straight_bet"
                value={formData.min_straight_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_exacta_bet">Exacta Bet ($):</label>
              <input
                type="number"
                id="min_exacta_bet"
                name="min_exacta_bet"
                value={formData.min_exacta_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_trifecta_bet">Trifecta Bet ($):</label>
              <input
                type="number"
                id="min_trifecta_bet"
                name="min_trifecta_bet"
                value={formData.min_trifecta_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_superfecta_bet">Superfecta Bet ($):</label>
              <input
                type="number"
                id="min_superfecta_bet"
                name="min_superfecta_bet"
                value={formData.min_superfecta_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_pick_2_bet">Pick 2 Bet ($):</label>
              <input
                type="number"
                id="min_pick_2_bet"
                name="min_pick_2_bet"
                value={formData.min_pick_2_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_pick_3_bet">Pick 3 Bet ($):</label>
              <input
                type="number"
                id="min_pick_3_bet"
                name="min_pick_3_bet"
                value={formData.min_pick_3_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_pick_4_bet">Pick 4 Bet ($):</label>
              <input
                type="number"
                id="min_pick_4_bet"
                name="min_pick_4_bet"
                value={formData.min_pick_4_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_pick_5_bet">Pick 5 Bet ($):</label>
              <input
                type="number"
                id="min_pick_5_bet"
                name="min_pick_5_bet"
                value={formData.min_pick_5_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="min_pick_6_bet">Pick 6 Bet ($):</label>
              <input
                type="number"
                id="min_pick_6_bet"
                name="min_pick_6_bet"
                value={formData.min_pick_6_bet}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
            </div>
          </div>
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
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}