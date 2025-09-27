import { useState } from 'react';

export default function CommissionerPanel({
  onCreateRace,
  onUpdateRace,
  onFinalizeRace,
  onSetPayoutRules,
  races = [],
  users = []
}) {
  const [activeTab, setActiveTab] = useState('races');
  const [newRace, setNewRace] = useState({
    name: '',
    track: '',
    startTime: '',
    distance: '',
    prizePool: ''
  });

  const [payoutRules, setPayoutRules] = useState({
    winMultiplier: 2.0,
    placeMultiplier: 1.5,
    showMultiplier: 1.2,
    exactaPayoutPerDollar: 40,
    trifectaPayoutPerDollar: 300
  });

  const handleCreateRace = (e) => {
    e.preventDefault();
    if (!newRace.name || !newRace.startTime) return;

    onCreateRace?.({
      ...newRace,
      prizePool: Number(newRace.prizePool) || 0,
      horses: []
    });

    setNewRace({
      name: '',
      track: '',
      startTime: '',
      distance: '',
      prizePool: ''
    });
  };

  const handleFinalizeRace = (raceId, finishingOrder) => {
    onFinalizeRace?.(raceId, finishingOrder);
  };

  const handleUpdatePayoutRules = (e) => {
    e.preventDefault();
    onSetPayoutRules?.(payoutRules);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="commissioner-panel">
      <div className="commissioner-panel__header">
        <h2>Commissioner Panel</h2>
        <p>Administrative controls for race management</p>
      </div>

      <div className="commissioner-panel__tabs">
        <button
          className={`commissioner-panel__tab ${
            activeTab === 'races' ? 'commissioner-panel__tab--active' : ''
          }`}
          onClick={() => setActiveTab('races')}
        >
          Race Management
        </button>
        <button
          className={`commissioner-panel__tab ${
            activeTab === 'payouts' ? 'commissioner-panel__tab--active' : ''
          }`}
          onClick={() => setActiveTab('payouts')}
        >
          Payout Rules
        </button>
        <button
          className={`commissioner-panel__tab ${
            activeTab === 'users' ? 'commissioner-panel__tab--active' : ''
          }`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      <div className="commissioner-panel__content">
        {activeTab === 'races' && (
          <div className="commissioner-panel__section">
            <div className="commissioner-panel__subsection">
              <h3>Create New Race</h3>
              <form onSubmit={handleCreateRace} className="commissioner-panel__form">
                <div className="commissioner-panel__form-grid">
                  <label className="commissioner-panel__label">
                    Race Name *
                    <input
                      type="text"
                      className="commissioner-panel__input"
                      value={newRace.name}
                      onChange={(e) => setNewRace(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </label>

                  <label className="commissioner-panel__label">
                    Track
                    <input
                      type="text"
                      className="commissioner-panel__input"
                      value={newRace.track}
                      onChange={(e) => setNewRace(prev => ({ ...prev, track: e.target.value }))}
                    />
                  </label>

                  <label className="commissioner-panel__label">
                    Start Time *
                    <input
                      type="datetime-local"
                      className="commissioner-panel__input"
                      value={newRace.startTime}
                      onChange={(e) => setNewRace(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </label>

                  <label className="commissioner-panel__label">
                    Distance
                    <input
                      type="text"
                      className="commissioner-panel__input"
                      value={newRace.distance}
                      onChange={(e) => setNewRace(prev => ({ ...prev, distance: e.target.value }))}
                      placeholder="e.g., 1 mile, 6 furlongs"
                    />
                  </label>

                  <label className="commissioner-panel__label">
                    Prize Pool ($)
                    <input
                      type="number"
                      className="commissioner-panel__input"
                      value={newRace.prizePool}
                      onChange={(e) => setNewRace(prev => ({ ...prev, prizePool: e.target.value }))}
                      min="0"
                      step="100"
                    />
                  </label>
                </div>

                <button type="submit" className="commissioner-panel__button">
                  Create Race
                </button>
              </form>
            </div>

            <div className="commissioner-panel__subsection">
              <h3>Existing Races</h3>
              <div className="commissioner-panel__races">
                {races.length === 0 ? (
                  <p>No races created yet.</p>
                ) : (
                  races.map(race => (
                    <div key={race.id} className="commissioner-panel__race-card">
                      <div className="commissioner-panel__race-info">
                        <h4>{race.name}</h4>
                        <p><strong>Track:</strong> {race.track || 'N/A'}</p>
                        <p><strong>Start:</strong> {formatDateTime(race.startTime)}</p>
                        <p><strong>Status:</strong> {race.status || 'Pending'}</p>
                        {race.prizePool && (
                          <p><strong>Prize Pool:</strong> ${race.prizePool.toLocaleString()}</p>
                        )}
                      </div>

                      <div className="commissioner-panel__race-actions">
                        <button
                          className="commissioner-panel__button commissioner-panel__button--small"
                          onClick={() => onUpdateRace?.(race.id)}
                        >
                          Edit
                        </button>
                        {race.status === 'finished' ? (
                          <span className="commissioner-panel__status">Finalized</span>
                        ) : (
                          <button
                            className="commissioner-panel__button commissioner-panel__button--small commissioner-panel__button--primary"
                            onClick={() => handleFinalizeRace(race.id, race.finishingOrder)}
                          >
                            Finalize
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="commissioner-panel__section">
            <h3>Payout Rules Configuration</h3>
            <form onSubmit={handleUpdatePayoutRules} className="commissioner-panel__form">
              <div className="commissioner-panel__form-grid">
                <label className="commissioner-panel__label">
                  Win Multiplier
                  <input
                    type="number"
                    className="commissioner-panel__input"
                    value={payoutRules.winMultiplier}
                    onChange={(e) => setPayoutRules(prev => ({ ...prev, winMultiplier: Number(e.target.value) }))}
                    min="1"
                    step="0.1"
                  />
                </label>

                <label className="commissioner-panel__label">
                  Place Multiplier
                  <input
                    type="number"
                    className="commissioner-panel__input"
                    value={payoutRules.placeMultiplier}
                    onChange={(e) => setPayoutRules(prev => ({ ...prev, placeMultiplier: Number(e.target.value) }))}
                    min="1"
                    step="0.1"
                  />
                </label>

                <label className="commissioner-panel__label">
                  Show Multiplier
                  <input
                    type="number"
                    className="commissioner-panel__input"
                    value={payoutRules.showMultiplier}
                    onChange={(e) => setPayoutRules(prev => ({ ...prev, showMultiplier: Number(e.target.value) }))}
                    min="1"
                    step="0.1"
                  />
                </label>

                <label className="commissioner-panel__label">
                  Exacta Payout (per $1)
                  <input
                    type="number"
                    className="commissioner-panel__input"
                    value={payoutRules.exactaPayoutPerDollar}
                    onChange={(e) => setPayoutRules(prev => ({ ...prev, exactaPayoutPerDollar: Number(e.target.value) }))}
                    min="1"
                    step="1"
                  />
                </label>

                <label className="commissioner-panel__label">
                  Trifecta Payout (per $1)
                  <input
                    type="number"
                    className="commissioner-panel__input"
                    value={payoutRules.trifectaPayoutPerDollar}
                    onChange={(e) => setPayoutRules(prev => ({ ...prev, trifectaPayoutPerDollar: Number(e.target.value) }))}
                    min="1"
                    step="1"
                  />
                </label>
              </div>

              <button type="submit" className="commissioner-panel__button">
                Update Payout Rules
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="commissioner-panel__section">
            <h3>User Management</h3>
            <div className="commissioner-panel__users">
              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="commissioner-panel__users-table">
                  <div className="commissioner-panel__users-header">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Balance</span>
                    <span>Actions</span>
                  </div>
                  {users.map(user => (
                    <div key={user.id} className="commissioner-panel__user-row">
                      <span>{user.name || 'N/A'}</span>
                      <span>{user.email}</span>
                      <span>{user.role || 'User'}</span>
                      <span>${user.balance || 0}</span>
                      <div className="commissioner-panel__user-actions">
                        <button className="commissioner-panel__button commissioner-panel__button--small">
                          Edit
                        </button>
                        <button className="commissioner-panel__button commissioner-panel__button--small commissioner-panel__button--danger">
                          Suspend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}