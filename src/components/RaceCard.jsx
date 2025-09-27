import { Link } from 'react-router-dom';

export default function RaceCard({ race, showBettingButton = true }) {
  const formatTime = (time) => {
    if (!time) return 'Time TBD';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPrizePool = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRaceStatus = () => {
    if (!race?.startTime) return 'pending';
    const now = new Date();
    const startTime = new Date(race.startTime);

    if (now < startTime) return 'upcoming';
    if (race.isFinished) return 'finished';
    return 'running';
  };

  const status = getRaceStatus();

  return (
    <div className={`race-card race-card--${status}`}>
      <div className="race-card__header">
        <h3 className="race-card__title">
          {race?.name || 'Unnamed Race'}
        </h3>
        <span className={`race-card__status race-card__status--${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="race-card__details">
        <div className="race-card__info">
          <p className="race-card__time">
            <strong>Start Time:</strong> {formatTime(race?.startTime)}
          </p>

          {race?.track && (
            <p className="race-card__track">
              <strong>Track:</strong> {race.track}
            </p>
          )}

          {race?.distance && (
            <p className="race-card__distance">
              <strong>Distance:</strong> {race.distance}
            </p>
          )}

          {race?.prizePool && (
            <p className="race-card__prize">
              <strong>Prize Pool:</strong> {formatPrizePool(race.prizePool)}
            </p>
          )}

          {race?.totalHorses && (
            <p className="race-card__horses">
              <strong>Horses:</strong> {race.totalHorses}
            </p>
          )}
        </div>

        <div className="race-card__actions">
          <Link
            to={`/race/${race?.id}`}
            className="race-card__view-btn"
          >
            View Details
          </Link>

          {showBettingButton && status === 'upcoming' && (
            <Link
              to={`/race/${race?.id}/bet`}
              className="race-card__bet-btn"
            >
              Place Bet
            </Link>
          )}

          {status === 'finished' && race?.results && (
            <Link
              to={`/race/${race?.id}/results`}
              className="race-card__results-btn"
            >
              View Results
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}