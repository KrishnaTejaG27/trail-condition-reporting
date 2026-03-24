import React, { useState, useEffect } from 'react';

function UserReports({ onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchUserReports();
  }, [filter]);

  const fetchUserReports = async () => {
    try {
      let url = '/api/users/reports';
      if (filter) {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Error fetching user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setReports(reports.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'flagged': return '#ffc107';
      case 'removed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-reports-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 My Reports</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="filter-bar" style={{ marginBottom: '15px' }}>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="flagged">Flagged</option>
              <option value="removed">Removed</option>
            </select>
          </div>

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            <div className="user-reports-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {reports.map(report => (
                <div 
                  key={report.id} 
                  className="user-report-item"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    background: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0' }}>
                        <span 
                          className={`hazard-badge hazard-${report.hazard_type}`}
                          style={{
                            background: '#e9ecef',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {report.hazard_type}
                        </span>
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                        {report.description || 'No description'}
                      </p>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <span>Trail: {report.trail_name || 'Unknown'}</span>
                        <br />
                        <span>👍 {report.upvotes} confirms</span>
                        <br />
                        <span style={{ color: getStatusColor(report.status) }}>
                          Status: {report.status}
                        </span>
                        <br />
                        <span style={{ color: isExpired(report.expires_at) ? '#dc3545' : '#28a745' }}>
                          {isExpired(report.expires_at) ? 'EXPIRED' : `Expires: ${new Date(report.expires_at).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteReport(report.id)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {report.image_url && (
                    <img 
                      src={report.image_url} 
                      alt="Report" 
                      style={{ maxWidth: '150px', borderRadius: '4px', marginTop: '10px' }} 
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserReports;
