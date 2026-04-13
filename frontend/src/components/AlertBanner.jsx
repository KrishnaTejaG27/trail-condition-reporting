import React from 'react';

function AlertBanner({ alerts }) {
  if (alerts.length === 0) return null;

  // Only show the highest priority alert
  const topAlert = alerts[0];

  return (
    <div className={`alert-banner ${topAlert.hazard_type === 'Flooding' || topAlert.hazard_type === 'Closed' ? 'danger' : ''}`}>
      <div className="alert-content">
        <span className="alert-icon">⚠️</span>
        <span>
          <strong>{topAlert.hazard_type}</strong> reported at{' '}
          <strong>{topAlert.trail_name}</strong>
          {' '}(High Confidence - {topAlert.upvotes} confirmations)
        </span>
      </div>
      <button 
        className="close-alert"
        onClick={() => {
          // Hide this alert - in production, track dismissed alerts
          document.querySelector('.alert-banner').style.display = 'none';
        }}
      >
        ×
      </button>
    </div>
  );
}

export default AlertBanner;
