import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <p>The page may have been moved, deleted, or you entered the wrong URL.</p>

        <div className="not-found-actions">
          <Link to="/events" className="home-link">
            Go to All Events
          </Link>
          <Link to="/account" className="account-link">
            Account Settings
          </Link>
        </div>
      </div>
    </div>
  );
}