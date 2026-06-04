import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import Header from './components/Header';
import Converter from './components/Converter';
import Calculator from './components/Calculator';
import HistoryList from './components/HistoryList';
import { logger } from './utils/logger';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState('LENGTH');
  const [activeTab, setActiveTab] = useState('CONVERTER');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Capture OAuth2 redirect parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlRefreshToken = params.get('refreshToken');
    if (window.location.pathname.startsWith('/oauth2/redirect') && urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      if (urlRefreshToken) {
        localStorage.setItem('refreshToken', urlRefreshToken);
        setRefreshToken(urlRefreshToken);
      }
      logger.info('OAuth2 login successful');
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Sync user profile from localStorage or fetch from backend if empty
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [token]);

  // Proactive Token Refresh Timer (runs every 55 seconds before 60-second expiration)
  useEffect(() => {
    if (!token || !refreshToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        logger.info('Proactively refreshing access token...');
        const response = await axios.post('/auth/api/v1/auth/refresh', {
          refreshToken: refreshToken
        });
        
        const newAccessToken = response.data.token;
        const newRefreshToken = response.data.refreshToken;

        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        setToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        logger.info('Access token proactively refreshed successfully');
      } catch (err) {
        logger.error('Failed to proactively refresh token, logging out', err);
        handleLogout();
      }
    }, 55000); // 55 seconds

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken]);

  useEffect(() => {
    if (token && !user) {
      const fetchProfile = async () => {
        try {
          const response = await axios.get('/auth/api/v1/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const profileData = response.data;
          const userObj = {
            name: profileData.name,
            email: profileData.email,
            role: profileData.role
          };
          localStorage.setItem('user', JSON.stringify(userObj));
          setUser(userObj);
          logger.info('User profile fetched successfully');
        } catch (e) {
          logger.error("Failed to fetch user profile", e);
          handleLogout();
        }
      };
      fetchProfile();
    }
  }, [token, user]);

  const handleAuthSuccess = (newToken, authResponse) => {
    setToken(newToken);
    if (authResponse.refreshToken) {
      setRefreshToken(authResponse.refreshToken);
      localStorage.setItem('refreshToken', authResponse.refreshToken);
    }
    setUser({
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role
    });
    logger.info('Local login successful');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    logger.info('User logged out');
  };

  const handleOperationCompleted = () => {
    // Increment to trigger a reload of the History list component
    setRefreshTrigger(prev => prev + 1);
  };

  if (!token) {
    return (
      <div className="animated-fadeIn" style={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="animated-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Header user={user} onLogout={handleLogout} />

      <div className="dashboard-container">
        {/* Sidebar navigation */}
        <aside className="glass-panel category-sidebar animated-fadeIn">
          <div className="sidebar-title">Categories</div>
          
          <button 
            className={`category-btn ${activeCategory === 'LENGTH' ? 'active' : ''}`}
            onClick={() => { setActiveCategory('LENGTH'); }}
            type="button"
          >
            📏 Length
          </button>
          
          <button 
            className={`category-btn ${activeCategory === 'VOLUME' ? 'active' : ''}`}
            onClick={() => { setActiveCategory('VOLUME'); }}
            type="button"
          >
            🧪 Volume
          </button>
          
          <button 
            className={`category-btn ${activeCategory === 'WEIGHT' ? 'active' : ''}`}
            onClick={() => { setActiveCategory('WEIGHT'); }}
            type="button"
          >
            ⚖️ Weight
          </button>
          
          <button 
            className={`category-btn ${activeCategory === 'TEMPERATURE' ? 'active' : ''}`}
            onClick={() => { setActiveCategory('TEMPERATURE'); }}
            type="button"
          >
            🌡️ Temperature
          </button>
        </aside>

        {/* Work Area */}
        <main className="operations-area">
          <div className="operations-tabs">
            <button 
              className={`op-tab-btn ${activeTab === 'CONVERTER' ? 'active' : ''}`}
              onClick={() => setActiveTab('CONVERTER')}
              type="button"
            >
              Unit Converter
            </button>
            <button 
              className={`op-tab-btn ${activeTab === 'CALCULATOR' ? 'active' : ''} ${activeCategory === 'TEMPERATURE' ? 'disabled' : ''}`}
              onClick={() => {
                if (activeCategory !== 'TEMPERATURE') {
                  setActiveTab('CALCULATOR');
                }
              }}
              title={activeCategory === 'TEMPERATURE' ? 'Arithmetic is not supported for Temperature' : ''}
              type="button"
            >
              Arithmetic & Compare
            </button>
          </div>

          {activeTab === 'CONVERTER' ? (
            <Converter 
              category={activeCategory} 
              token={token} 
              onOperationCompleted={handleOperationCompleted} 
            />
          ) : (
            <Calculator 
              category={activeCategory} 
              token={token} 
              onOperationCompleted={handleOperationCompleted} 
            />
          )}
        </main>
      </div>

      <HistoryList token={token} refreshTrigger={refreshTrigger} />

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} QuantityManagement Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
