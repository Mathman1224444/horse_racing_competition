import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Basic username validation
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Register the user with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            display_name: formData.username
          }
        }
      });

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // User is confirmed, redirect to intended page
          navigate(from, { replace: true });
        } else {
          // Email confirmation required
          setError('Please check your email and click the confirmation link to complete registration');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">
            Join our horse betting platform today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="register-error">
              <span className="register-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="register-field">
            <label htmlFor="email" className="register-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="register-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              disabled={loading}
            />
            <small className="register-help-text">
              Used for login and account verification
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="username" className="register-label">
              Display Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="register-input"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a display name"
              required
              autoComplete="username"
              disabled={loading}
            />
            <small className="register-help-text">
              3+ characters, letters, numbers, and underscores only. Visible to other users.
            </small>
          </div>



          <div className="register-field">
            <label htmlFor="password" className="register-label">
              Password
            </label>
            <div className="register-password-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="register-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="register-help-text">
              Password must be at least 6 characters long
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword" className="register-label">
              Confirm Password
            </label>
            <div className="register-password-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="register-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="register-terms">
            <label className="register-terms-checkbox">
              <input type="checkbox" required />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="register-terms-link">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="register-terms-link">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <div className="register-actions">
            <button
              type="submit"
              className="register-button register-button--primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="register-login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}