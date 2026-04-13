import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2h1Y3I5M3Mwa3A4MnJydHR4bXJ2bmhoIn0.example'; // Replace with actual token

function MapView({ user, userLocation, onReportClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [trails, setTrails] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLocation) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }));

    map.current.on('load', () => {
      fetchTrails();
      fetchReports();
    });

    // PRD MVP: Poll backend every 30 seconds for real-time updates
    const pollInterval = setInterval(() => {
      if (map.current) {
        fetchReports();
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      map.current.remove();
    };
  }, [userLocation]);

  const fetchTrails = async () => {
    try {
      const response = await fetch(
        `/api/trails?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=15000`
      );
      if (response.ok) {
        const data = await response.json();
        setTrails(data);
        addTrailMarkers(data);
      }
    } catch (err) {
      console.error('Error fetching trails:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `/api/reports?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=15000`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data);
        addReportMarkers(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const addTrailMarkers = (trails) => {
    trails.forEach(trail => {
      const el = document.createElement('div');
      el.className = 'trail-marker';
      el.style.cssText = `
        width: 14px;
        height: 14px;
        background: #4a9c44;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(`
        <div class="trail-popup">
          <h3>${trail.name}</h3>
          <p>${trail.description || 'No description'}</p>
          <div class="trail-meta">
            <span>${trail.difficulty || 'N/A'}</span>
            <span>${trail.length_miles ? trail.length_miles + ' mi' : 'N/A'}</span>
          </div>
          ${user ? `<button class="btn-report-small" onclick="window.reportTrail(${trail.id}, '${trail.name}')">Report Hazard</button>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([trail.longitude, trail.latitude])
        .setPopup(popup)
        .addTo(map.current);

      el.addEventListener('click', () => {
        setSelectedTrail(trail);
      });
    });

    // Global function for report button in popup
    window.reportTrail = (trailId, trailName) => {
      const trail = trails.find(t => t.id === trailId);
      if (trail) {
        onReportClick(trail);
      }
    };
  };

  const addReportMarkers = (reports) => {
    // Remove existing report markers
    document.querySelectorAll('.report-marker').forEach(el => el.remove());

    reports.forEach(report => {
      const el = document.createElement('div');
      el.className = 'report-marker';
      
      // Color based on hazard type and confidence
      let color = '#ffc107'; // default caution
      let size = '16px';
      
      if (report.hazard_type === 'closed_trail' || report.hazard_type === 'flooding') {
        color = '#dc3545'; // danger
        size = '18px';
      } else if (report.upvotes >= 3) {
        color = '#28a745'; // high confidence
      }

      el.style.cssText = `
        width: ${size};
        height: ${size};
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      `;

      const confidenceLevel = report.upvotes >= 3 ? 'high' : report.upvotes >= 1 ? 'medium' : 'low';
      const confidenceLabel = report.upvotes >= 3 ? '✅ High Confidence' : report.upvotes >= 1 ? '⚠️ Medium Confidence' : '❓ Low Confidence';

      const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(`
        <div class="trail-popup">
          <h3>${report.hazard_type}</h3>
          <p>${report.description || 'No description'}</p>
          ${report.image_url ? `<img src="${report.image_url}" style="max-width: 200px; border-radius: 4px; margin: 8px 0;" />` : ''}
          <div style="font-size: 12px; color: #666; margin-top: 8px;">
            <span class="confidence-${confidenceLevel}">
              ${confidenceLabel}
            </span>
            <br/>
            <span>👍 ${report.upvotes} confirms</span>
            <br/>
            <span>Expires: ${new Date(report.expires_at).toLocaleDateString()}</span>
          </div>
          ${user ? `
            <div style="margin-top: 12px;">
              <button class="btn-small btn-primary" onclick="window.upvoteReport(${report.id})">👍 Confirm</button>
            </div>
          ` : ''}
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(map.current);
    });

    window.upvoteReport = async (reportId) => {
      try {
        const response = await fetch(`/api/reports/${reportId}/upvote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          fetchReports();
        }
      } catch (err) {
        console.error('Error upvoting:', err);
      }
    };
  };

  const getConfidenceLevel = (score) => {
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 5) return '✅ High Confidence';
    if (score >= 2) return '⚠️ Medium Confidence';
    return '❓ Low Confidence';
  };

  return (
    <div className="map-wrapper">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading trail data...</p>
        </div>
      )}
      <div ref={mapContainer} className="map-container" />
      
      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-marker trail"></span>
          <span>Trail</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker danger"></span>
          <span>High Risk</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker caution"></span>
          <span>Caution</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker verified"></span>
          <span>Verified</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .map-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #ddd;
          border-top-color: #4a9c44;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 10;
        }
        
        .map-legend h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
          font-size: 12px;
        }
        
        .legend-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .legend-marker.trail {
          background: #4a9c44;
        }
        
        .legend-marker.danger {
          background: #dc3545;
        }
        
        .legend-marker.caution {
          background: #ffc107;
        }
        
        .legend-marker.verified {
          background: #28a745;
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        
        .btn-small.btn-primary {
          background: #4a9c44;
          color: white;
        }
        
        .btn-small.btn-secondary {
          background: #f5f5f5;
          color: #666;
        }
      `}</style>
    </div>
  );
}

export default MapView;
