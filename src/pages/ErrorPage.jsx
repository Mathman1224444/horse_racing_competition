import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
        <Link to="/events">Go to Events</Link>
      </div>
    </div>
  );
}