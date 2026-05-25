import React from 'react';

export default function Header({ user, onLogout }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="glass-panel app-header animated-fadeIn">
      <div className="app-title-group">
        <span className="app-logo-icon">⚖️</span>
        <h1 className="app-title">QuantityManagement</h1>
      </div>
      
      {user && (
        <div className="user-profile-card">
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <div className="user-avatar" title={user.role}>
            {getInitials(user.name)}
          </div>
          <button 
            onClick={onLogout} 
            className="btn btn-secondary btn-danger-hover"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
