import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapView from './components/MapView';
import ReportForm from './components/ReportForm';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AlertBanner from './components/AlertBanner';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
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
                <span className="user-info">{user.email}</span>
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
