import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Race() {
  const { raceId } = useParams();
  const { user, appUser } = useOutletContext();
  const [race, setRace] = useState(null);
  const [event, setEvent] = useState(null);
  const [raceResults, setRaceResults] = useState(null);
  const [scratches, setScratches] = useState([]);
  const [playerWallets, setPlayerWallets] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (raceId && appUser) {
      loadRaceData();
    }
  }, [raceId, appUser]);

  const loadRaceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadRace(),
        loadScratches(),
        loadPlayerWallets(),
        loadBets()
      ]);
    } catch (err) {
      setError('Error loading race data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRace = async () => {
    const { data: raceData, error: raceError } = await supabase
      .from('races')
      .select(`
        *,
        race_results:race_resultsId (*)
      `)
      .eq('raceId', raceId)
      .single();

    if (raceError) throw raceError;
    setRace(raceData);
    setRaceResults(raceData.race_results);

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('eventId', raceData.eventId)
      .single();

    if (eventError) throw eventError;
    setEvent(eventData);
  };

  const loadScratches = async () => {
    const { data, error } = await supabase
      .from('scratches')
      .select('horse_num')
      .eq('raceId', raceId);

    if (error) throw error;
    setScratches(data.map(s => s.horse_num));
  };

  const loadPlayerWallets = async () => {
    if (!race?.eventId) return;

    const { data: entrants, error: entrantsError } = await supabase
      .from('entrants')
      .select(`
        playerId,
        app_users:playerId (username)
      `)
      .eq('eventId', race.eventId);

    if (entrantsError) throw entrantsError;

    const walletsData = await Promise.all(
      entrants.map(async (entrant) => {
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select('bet_winnings')
          .eq('playerId', entrant.playerId)
          .eq('eventId', race.eventId);

        if (betsError) throw betsError;

        const { data: raceBets, error: raceBetsError } = await supabase
          .from('bets')
          .select('bet_winnings, resolution')
          .eq('playerId', entrant.playerId)
          .eq('raceId', raceId);

        if (raceBetsError) throw raceBetsError;

        const totalWinnings = bets.reduce((sum, bet) => sum + (bet.bet_winnings || 0), 0);
        const raceResults = raceBets.map(bet => `${bet.resolution}: $${bet.bet_winnings.toFixed(2)}`).join(', ');

        return {
          username: entrant.app_users?.username || 'Unknown',
          race_wallet: 0, // This would need to be calculated based on your business logic
          event_wallet: 0, // This would need to be calculated based on your business logic
          winnings: totalWinnings,
          results: raceResults || 'No bets'
        };
      })
    );

    setPlayerWallets(walletsData.sort((a, b) => a.username.localeCompare(b.username)));
  };

  const loadBets = async () => {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        app_users:playerId (username)
      `)
      .eq('raceId', raceId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    setBets(data);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedBets = [...bets].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (sortColumn === 'username') {
      aVal = a.app_users?.username || '';
      bVal = b.app_users?.username || '';
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  if (loading) {
    return <div className="loading">Loading race details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!race || !event) {
    return <div className="error">Race not found</div>;
  }

  return (
    <div className="race-page">
      <div className="race-header">
        <h1>Race {race.race_number}</h1>
        <Link to={`/race/${raceId}/bet`} className="make-bet-button">
          Make Bet
        </Link>
      </div>

      <div className="race-basic-info">
        <div className="race-details">
          <p><strong>Event:</strong> {event.event_name}</p>
          <p><strong>Race Number:</strong> {race.race_number}</p>
          <p><strong>Post Time:</strong> {new Date(race.post_time).toLocaleString()}</p>
          <p><strong>Number of Horses:</strong> {race.num_horses}</p>
          <p><strong>Status:</strong> {race.is_resolved ? 'Resolved' : 'Pending'}</p>
        </div>
      </div>

      <div className="scratches-results-section">
        <h2>Scratches & Results</h2>
        <div className="scratches-results-content">
          <div className="scratches">
            <h3>Scratched Horses</h3>
            {scratches.length > 0 ? (
              <ul>
                {scratches.map((horseNum, index) => (
                  <li key={index}>Horse {horseNum}</li>
                ))}
              </ul>
            ) : (
              <p>No scratches</p>
            )}
          </div>

          {raceResults && (
            <div className="results">
              <h3>Finishing Order</h3>
              <ol>
                <li>Horse {raceResults.first_horse}</li>
                <li>Horse {raceResults.second_horse}</li>
                <li>Horse {raceResults.third_horse}</li>
                <li>Horse {raceResults.fourth_horse}</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {raceResults && (
        <div className="payouts-section">
          <h2>Payouts</h2>
          <div className="payouts-grid">
            <div className="win-place-show">
              <h3>Win/Place/Show</h3>
              <p>Horse {raceResults.first_horse} Win: {raceResults.horse_1_win_mult}x</p>
              <p>Horse {raceResults.first_horse} Place: {raceResults.horse_1_place_mult}x</p>
              <p>Horse {raceResults.first_horse} Show: {raceResults.horse_1_show_mult}x</p>
              <p>Horse {raceResults.second_horse} Place: {raceResults.horse_2_place_mult}x</p>
              <p>Horse {raceResults.second_horse} Show: {raceResults.horse_2_show_mult}x</p>
              <p>Horse {raceResults.third_horse} Show: {raceResults.horse_3_show_mult}x</p>
            </div>

            <div className="exotic-bets">
              <h3>Exotic Bets</h3>
              <p>Exacta: {raceResults.exacta_mult}x</p>
              <p>Trifecta: {raceResults.trifecta_mult}x</p>
              <p>Superfecta: {raceResults.superfecta_mult}x</p>
            </div>

            <div className="pick-bets">
              <h3>Pick Bets</h3>
              <p>Pick 2: {raceResults.pick_2_mult}x</p>
              <p>Pick 3: {raceResults.pick_3_mult}x</p>
              <p>Pick 4: {raceResults.pick_4_mult}x</p>
              <p>Pick 5: {raceResults.pick_5_mult}x</p>
              <p>Pick 6: {raceResults.pick_6_mult}x</p>
            </div>
          </div>
        </div>
      )}

      <div className="player-wallets-section">
        <h2>Player Wallets</h2>
        <table className="wallets-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Race Wallet</th>
              <th>Event Wallet</th>
              <th>Winnings</th>
              <th>Results</th>
            </tr>
          </thead>
          <tbody>
            {playerWallets.map((player, index) => (
              <tr key={index}>
                <td>{player.username}</td>
                <td>${player.race_wallet.toFixed(2)}</td>
                <td>${player.event_wallet.toFixed(2)}</td>
                <td>${player.winnings.toFixed(2)}</td>
                <td>{player.results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="race-bets-section">
        <h2>Race Bets</h2>
        <table className="bets-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')} className="sortable">
                Timestamp {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('username')} className="sortable">
                Username {sortColumn === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('bet_type')} className="sortable">
                Bet Type {sortColumn === 'bet_type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('bet_unit')} className="sortable">
                Bet Unit {sortColumn === 'bet_unit' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('bet_cost')} className="sortable">
                Bet Cost {sortColumn === 'bet_cost' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('resolution')} className="sortable">
                Resolution {sortColumn === 'resolution' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Bet Horses</th>
              <th onClick={() => handleSort('bet_winnings')} className="sortable">
                Winnings {sortColumn === 'bet_winnings' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBets.map((bet) => (
              <tr key={bet.betId}>
                <td>{new Date(bet.timestamp).toLocaleString()}</td>
                <td>{bet.app_users?.username || 'Unknown'}</td>
                <td>{bet.bet_type}</td>
                <td>${bet.bet_unit.toFixed(2)}</td>
                <td>${bet.bet_cost.toFixed(2)}</td>
                <td>{bet.resolution}</td>
                <td>{bet.bet_horses}</td>
                <td>${bet.bet_winnings.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}