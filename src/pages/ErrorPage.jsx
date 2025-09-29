import { Link, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="error-page">
      <div className="error-container">
        <h1>Oops! Something went wrong</h1>
        <p>We apologize for the inconvenience. An unexpected error has occurred.</p>

        {error && (
          <div className="error-details">
            <p><strong>Error:</strong> {error.statusText || error.message}</p>
            {error.status && <p><strong>Status:</strong> {error.status}</p>}
          </div>
        )}

        <div className="error-actions">
          <Link to="/events" className="home-link">
            Go to All Events
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        </div>

        <div className="error-help">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}