import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Account() {
  const { user, appUser, setAppUser } = useOutletContext();
  const [username, setUsername] = useState('');
  const [slogan, setSlogan] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (appUser) {
      setUsername(appUser.username || '');
      setSlogan(appUser.slogan || '');
    }
  }, [appUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (username.length > 16) {
      setError('Username must be 16 characters or less');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .update({
          username: username,
          slogan: slogan
        })
        .eq('playerId', appUser.playerId)
        .select()
        .single();

      if (error) throw error;

      setAppUser(data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // For password updates, we'll use the current session
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully');
    } catch (err) {
      setError('Error updating password: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!appUser) {
    return <div className="loading">Loading account information...</div>;
  }

  return (
    <div className="account-page">
      <h1>Account Settings</h1>

      <div className="account-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="profile-tab">
          <h2>Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="readonly-field"
              />
              <small>Email cannot be changed from this page</small>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username (max 16 characters):</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={16}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="slogan">Slogan:</label>
              <input
                type="text"
                id="slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Enter your personal slogan"
                disabled={loading}
              />
            </div>


            <button type="submit" disabled={loading} className="update-profile-button">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="password-tab">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordReset} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <small>Password must be at least 6 characters long</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="update-password-button">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      <div className="account-info">
        <h2>Account Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>User ID:</strong> {appUser.playerId}
          </div>
          <div className="info-item">
            <strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </div>
          <div className="info-item">
            <strong>Last Sign In:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
}