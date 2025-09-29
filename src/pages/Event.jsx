import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Event() {
  const { eventId } = useParams();
  const { user, appUser } = useOutletContext();
  const [event, setEvent] = useState(null);
  const [standings, setStandings] = useState([]);
  const [nextRace, setNextRace] = useState(null);
  const [scratches, setScratches] = useState([]);
  const [races, setRaces] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (eventId && appUser) {
      loadEventData();
    }
  }, [eventId, appUser]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEvent(),
        loadStandings(),
        loadNextRace(),
        loadRaces(),
        loadBets()
      ]);
    } catch (err) {
      setError('Error loading event data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('eventId', eventId)
      .single();

    if (error) throw error;
    setEvent(data);
  };

  const loadStandings = async () => {
    const { data: entrants, error: entrantsError } = await supabase
      .from('entrants')
      .select(`
        playerId,
        app_users:playerId (username)
      `)
      .eq('eventId', eventId);

    if (entrantsError) throw entrantsError;

    const standingsData = await Promise.all(
      entrants.map(async (entrant) => {
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select('bet_winnings')
          .eq('playerId', entrant.playerId)
          .eq('eventId', eventId);

        if (betsError) throw betsError;

        const winnings = bets.reduce((sum, bet) => sum + (bet.bet_winnings || 0), 0);

        return {
          username: entrant.app_users?.username || 'Unknown',
          winnings: winnings,
          race_wallet: 0, // These would need to be calculated based on your business logic
          event_wallet: 0,
          total: winnings
        };
      })
    );

    setStandings(standingsData.sort((a, b) => b.total - a.total));
  };

  const loadNextRace = async () => {
    const { data: raceData, error: raceError } = await supabase
      .from('races')
      .select('*')
      .eq('eventId', eventId)
      .eq('is_resolved', false)
      .order('race_number', { ascending: true })
      .limit(1);

    if (raceError) throw raceError;

    if (raceData[0]) {
      setNextRace(raceData[0]);

      const { data: scratchData, error: scratchError } = await supabase
        .from('scratches')
        .select('horse_num')
        .eq('raceId', raceData[0].raceId);

      if (scratchError) throw scratchError;
      setScratches(scratchData.map(s => s.horse_num));
    }
  };

  const loadRaces = async () => {
    const { data, error } = await supabase
      .from('races')
      .select(`
        *,
        race_results:race_resultsId (*)
      `)
      .eq('eventId', eventId)
      .order('race_number', { ascending: true });

    if (error) throw error;

    const racesWithWinners = await Promise.all(
      data.map(async (race) => {
        if (race.is_resolved) {
          const { data: raceBets, error: betsError } = await supabase
            .from('bets')
            .select(`
              bet_winnings,
              app_users:playerId (username)
            `)
            .eq('raceId', race.raceId)
            .order('bet_winnings', { ascending: false })
            .limit(1);

          if (betsError) {
            console.error('Error loading race bets:', betsError);
          }

          const bigWinner = raceBets?.[0];

          return {
            ...race,
            big_winner: bigWinner?.app_users?.username || 'N/A',
            big_win: bigWinner?.bet_winnings || 0
          };
        }
        return {
          ...race,
          big_winner: 'N/A',
          big_win: 0
        };
      })
    );

    setRaces(racesWithWinners);
  };

  const loadBets = async () => {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        app_users:playerId (username)
      `)
      .eq('eventId', eventId)
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
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  return (
    <div className="event-page">
      <div className="event-basic-info">
        <h1>{event.event_name}</h1>
        <div className="event-details">
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Number of Races:</strong> {event.num_races}</p>
          <p><strong>Current Race:</strong> {event.current_race_num}</p>
        </div>
      </div>

      <details className="event-rules">
        <summary>Event Rules</summary>
        <div className="rules-content">
          <p><strong>Event Wallet Per Player:</strong> ${event.event_wallet_per_player}</p>
          <p><strong>Race Wallet Per Player:</strong> ${event.race_wallet_per_player}</p>
          <p><strong>First Prize:</strong> ${event.first_prize}</p>
          <p><strong>Second Prize:</strong> ${event.second_prize}</p>
          <p><strong>Third Prize:</strong> ${event.third_prize}</p>
          <p><strong>Can Rebet Winnings:</strong> {event.can_rebet_winnings ? 'Yes' : 'No'}</p>
          <p><strong>Can Bet Future Races:</strong> {event.can_bet_future_race ? 'Yes' : 'No'}</p>
          <p><strong>Min/Max Bets Per Race:</strong> {event.min_bets_per_race} - {event.max_bets_per_race}</p>
          <p><strong>Minimum Bet Amounts:</strong></p>
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
      </details>

      <div className="standings-section">
        <h2>Standings</h2>
        <table className="standings-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Winnings</th>
              <th>Race Wallet</th>
              <th>Event Wallet</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr key={index}>
                <td>{player.username}</td>
                <td>${player.winnings.toFixed(2)}</td>
                <td>${player.race_wallet.toFixed(2)}</td>
                <td>${player.event_wallet.toFixed(2)}</td>
                <td>${player.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {nextRace && (
        <div className="next-race-section">
          <h2>Next Race</h2>
          <div className="race-overview">
            <p><strong>Race {nextRace.race_number}</strong></p>
            <p><strong>Post Time:</strong> {new Date(nextRace.post_time).toLocaleString()}</p>
            <p><strong>Scratched Horses:</strong> {scratches.length > 0 ? scratches.join(', ') : 'None'}</p>
            <Link to={`/race/${nextRace.raceId}`} className="race-link">
              View Race Details
            </Link>
          </div>
        </div>
      )}

      <div className="races-section">
        <h2>All Races</h2>
        <table className="races-table">
          <thead>
            <tr>
              <th>Race #</th>
              <th>Post Time</th>
              <th>1st Horse</th>
              <th>2nd Horse</th>
              <th>3rd Horse</th>
              <th>4th Horse</th>
              <th>Big Winner</th>
              <th>Big Win</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => (
              <tr key={race.raceId}>
                <td>
                  <Link to={`/race/${race.raceId}`}>
                    {race.race_number}
                  </Link>
                </td>
                <td>{new Date(race.post_time).toLocaleString()}</td>
                <td>{race.race_results?.first_horse || '-'}</td>
                <td>{race.race_results?.second_horse || '-'}</td>
                <td>{race.race_results?.third_horse || '-'}</td>
                <td>{race.race_results?.fourth_horse || '-'}</td>
                <td>{race.big_winner}</td>
                <td>${race.big_win.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bets-section">
        <h2>All Bets</h2>
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