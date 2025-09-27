import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Page Components
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventPage from './pages/EventPage.jsx';
import RacePage from './pages/RacePage.jsx';
import CommissionerPage from './pages/CommissionerPage.jsx';
import NotFound from './pages/NotFound.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      // Root redirect
      {
        index: true,
        element: <Navigate to="/events" replace />
      },

      // Public routes
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      },

      // Protected routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'events',
        element: (
          <ProtectedRoute>
            <div>Events List Page</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'event/:eventId',
        element: (
          <ProtectedRoute>
            <EventPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'races',
        element: (
          <ProtectedRoute>
            <div>Races List Page</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'race/:raceId',
        element: (
          <ProtectedRoute>
            <RacePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'race/:raceId/bet',
        element: (
          <ProtectedRoute>
            <RacePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'race/:raceId/results',
        element: (
          <ProtectedRoute>
            <RacePage />
          </ProtectedRoute>
        )
      },

      // User account routes
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <div>Account Settings Page</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'bets',
        element: (
          <ProtectedRoute>
            <div>User Bets History Page</div>
          </ProtectedRoute>
        )
      },

      // Commissioner routes
      {
        path: 'commissioner',
        element: (
          <ProtectedRoute>
            <CommissionerPage />
          </ProtectedRoute>
        )
      },

      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Dashboard</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/races',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <div>Admin Race Management</div>
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <div>Admin User Management</div>
          </ProtectedRoute>
        )
      },

      // Utility routes
      {
        path: 'forgot-password',
        element: <div>Forgot Password Page</div>
      },
      {
        path: 'reset-password',
        element: <div>Reset Password Page</div>
      },

      // 404 catch-all
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);