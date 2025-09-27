import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RaceCard from '../components/RaceCard';
import { supabase } from '../lib/supabaseClient';

export default function EventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw eventError;
      }

      setEvent(eventData);

      // Load races for this event
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (racesError) {
        throw racesError;
      }

      setRaces(racesData || []);
    } catch (err) {
      console.error('Error loading event data:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const getEventStatus = () => {
    if (!event?.event_date) return 'pending';

    const now = new Date();
    const eventDate = new Date(event.event_date);

    if (now < eventDate) return 'upcoming';
    if (now.toDateString() === eventDate.toDateString()) return 'active';
    return 'completed';
  };

  const groupRacesByDate = (races) => {
    const grouped = {};
    races.forEach(race => {
      const date = race.start_time ? race.start_time.split('T')[0] : 'Unknown';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(race);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="event-page-loading">
        <div className="loading-spinner">Loading event details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-page-error">
        <div className="error-content">
          <h2>Error Loading Event</h2>
          <p>{error}</p>
          <Link to="/events" className="error-back-btn">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-page-not-found">
        <div className="not-found-content">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/events" className="not-found-back-btn">
            Browse All Events
          </Link>
        </div>
      </div>
    );
  }

  const status = getEventStatus();
  const groupedRaces = groupRacesByDate(races);

  return (
    <div className="event-page">
      <div className="event-page__header">
        <div className="event-page__breadcrumb">
          <Link to="/events">Events</Link>
          <span className="breadcrumb-separator">›</span>
          <span>{event.name}</span>
        </div>

        <div className="event-page__hero">
          <div className="event-page__info">
            <h1 className="event-page__title">{event.name}</h1>
            <div className="event-page__meta">
              <span className={`event-page__status event-page__status--${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>

              {event.location && (
                <span className="event-page__location">
                  📍 {event.location}
                </span>
              )}
            </div>

            <div className="event-page__dates">
              <div className="event-page__date">
                <strong>Date:</strong> {formatDate(event.event_date)}
              </div>
            </div>

            {event.description && (
              <p className="event-page__description">{event.description}</p>
            )}
          </div>

          {event.image_url && (
            <div className="event-page__image">
              <img src={event.image_url} alt={event.name} />
            </div>
          )}
        </div>
      </div>

      <div className="event-page__content">
        <div className="event-page__section">
          <div className="event-page__section-header">
            <h2>Races ({races.length})</h2>
            {status === 'upcoming' && (
              <Link to={`/event/${eventId}/bet`} className="event-page__bet-all-btn">
                Place Bets
              </Link>
            )}
          </div>

          {races.length === 0 ? (
            <div className="event-page__empty">
              <p>No races scheduled for this event yet.</p>
              {status === 'upcoming' && (
                <p>Check back later for race schedules.</p>
              )}
            </div>
          ) : (
            <div className="event-page__races">
              {Object.entries(groupedRaces).map(([date, dayRaces]) => (
                <div key={date} className="event-page__race-day">
                  <h3 className="event-page__race-day-title">
                    {formatDate(date)}
                  </h3>
                  <div className="event-page__race-grid">
                    {dayRaces.map(race => (
                      <RaceCard
                        key={race.id}
                        race={race}
                        showBettingButton={status === 'upcoming' || status === 'active'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {event.rules && (
          <div className="event-page__section">
            <h2>Event Rules</h2>
            <div className="event-page__rules">
              <div dangerouslySetInnerHTML={{ __html: event.rules }} />
            </div>
          </div>
        )}

        {event.prizes && (
          <div className="event-page__section">
            <h2>Prizes & Payouts</h2>
            <div className="event-page__prizes">
              <div dangerouslySetInnerHTML={{ __html: event.prizes }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}