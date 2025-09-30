import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Page Components
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import PasswordReset from './pages/PasswordReset.jsx';
import AllEvents from './pages/AllEvents.jsx';
import Event from './pages/Event.jsx';
import Race from './pages/Race.jsx';
import MakeBet from './pages/MakeBet.jsx';
import Account from './pages/Account.jsx';
import AddEvent from './pages/AddEvent.jsx';
import AddRace from './pages/AddRace.jsx';
import EditRace from './pages/EditRace.jsx';
import EditRaceResults from './pages/EditRaceResults.jsx';
import EditBet from './pages/EditBet.jsx';
import AddScratch from './pages/AddScratch.jsx';
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
        path: 'events',
        element: (
          <ProtectedRoute>
            <AllEvents />
          </ProtectedRoute>
        )
      },
      {
        path: 'event/:eventId',
        element: (
          <ProtectedRoute>
            <Event />
          </ProtectedRoute>
        )
      },
      {
        path: 'race/:raceId',
        element: (
          <ProtectedRoute>
            <Race />
          </ProtectedRoute>
        )
      },
      {
        path: 'race/:raceId/bet',
        element: (
          <ProtectedRoute>
            <MakeBet />
          </ProtectedRoute>
        )
      },

      // User account routes
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        )
      },

      // Commissioner routes
      {
        path: 'add-event',
        element: (
          <ProtectedRoute>
            <AddEvent />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-race',
        element: (
          <ProtectedRoute>
            <AddRace />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-race',
        element: (
          <ProtectedRoute>
            <EditRace />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-race-results',
        element: (
          <ProtectedRoute>
            <EditRaceResults />
          </ProtectedRoute>
        )
      },
      {
        path: 'edit-bet',
        element: (
          <ProtectedRoute>
            <EditBet />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-scratch',
        element: (
          <ProtectedRoute>
            <AddScratch />
          </ProtectedRoute>
        )
      },

      // Utility routes
      {
        path: 'forgot-password',
        element: <ForgotPassword />
      },
      {
        path: 'reset-password',
        element: <PasswordReset />
      },

      // 404 catch-all
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);