import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapView from './components/MapView';
import ReportForm from './components/ReportForm';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AlertBanner from './components/AlertBanner';
import UserProfile from './components/UserProfile';
import UserReports from './components/UserReports';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserReports, setShowUserReports] = useState(false);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ lat: 41.8781, lng: -87.6298 }); // Default to Chicago
        }
      );
    }
  }, []);

  useEffect(() => {
    if (user && userLocation) {
      fetchAlerts();
    }
  }, [user, userLocation]);

  // PRD Section 7.1: Token refresh mechanism - refresh every 23 hours
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
        } else {
          // Token refresh failed, logout user
          handleLogout();
        }
      } catch (err) {
        console.error('Token refresh error:', err);
      }
    };

    // Refresh token every 23 hours (token expires in 24 hours)
    const refreshInterval = setInterval(refreshToken, 23 * 60 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        `/api/alerts?lat=${userLocation.lat}&lng=${userLocation.lng}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">
            <span className="logo-icon">🥾</span>
            <h1>TrailWatch</h1>
          </div>
          <nav className="nav">
            {user ? (
              <>
                <button onClick={() => setShowUserProfile(true)} className="btn btn-secondary" style={{ marginRight: '10px' }}>
                  👤 Profile
                </button>
                <button onClick={() => setShowUserReports(true)} className="btn btn-secondary" style={{ marginRight: '10px' }}>
                  📋 My Reports
                </button>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => window.location.href = '/login'} className="btn btn-primary">
                Login
              </button>
            )}
          </nav>
        </header>

        <AlertBanner alerts={alerts} />

        <main className="app-main">
          <Routes>
            <Route path="/" element={
              <MapView 
                user={user}
                userLocation={userLocation}
                onReportClick={(trail) => {
                  setSelectedTrail(trail);
                  setShowReportForm(true);
                }}
              />
            } />
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/admin" element={
              user ? <AdminPanel /> : <Navigate to="/login" />
            } />
          </Routes>
        </main>

        {showReportForm && (
          <ReportForm
            trail={selectedTrail}
            userLocation={userLocation}
            onClose={() => {
              setShowReportForm(false);
              setSelectedTrail(null);
            }}
            onSubmit={() => {
              setShowReportForm(false);
              setSelectedTrail(null);
              fetchAlerts();
            }}
          />
        )}

        {showUserProfile && (
          <UserProfile onClose={() => setShowUserProfile(false)} />
        )}

        {showUserReports && (
          <UserReports onClose={() => setShowUserReports(false)} />
        )}

        {user && (
          <button 
            className="fab-report"
            onClick={() => setShowReportForm(true)}
          >
            ⚠️ Report
          </button>
        )}
      </div>
    </Router>
  );
}

export default App;
