import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.jsx';
import './styles.css';

// Error boundary component for global error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h1>🐴 Oops! Something went wrong</h1>
            <p>We're sorry, but something unexpected happened.</p>
            <details className="error-boundary__details">
              <summary>Error details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
            <button
              className="error-boundary__reload"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize the application
function initializeApp() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found. Make sure your HTML has a div with id="root"');
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </StrictMode>
  );
}

// Handle application initialization
try {
  initializeApp();
} catch (error) {
  console.error('Failed to initialize application:', error);

  // Fallback error display
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
    ">
      <div>
        <h1 style="color: #dc3545; margin-bottom: 16px;">
          🚫 Application Failed to Start
        </h1>
        <p style="color: #666; margin-bottom: 20px;">
          There was a problem starting the Horse Betting Platform.
        </p>
        <button
          onclick="window.location.reload()"
          style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Try Again
        </button>
      </div>
    </div>
  `;
}
