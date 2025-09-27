export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/dashboard">Go to Dashboard</a>
      </div>
    </div>
  );
}