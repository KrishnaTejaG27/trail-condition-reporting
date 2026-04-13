import React, { useState, useEffect } from 'react';

function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
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

  const getConfidenceLevel = (upvotes) => {
    if (upvotes >= 3) return 'high';
    if (upvotes >= 1) return 'medium';
    return 'low';
  };

  const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>🛡️ Admin Panel</h2>
        <span>{reports.length} total reports</span>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="reports-list">
          {reports.map(report => (
            <div key={report.id} className="report-item">
              <div className="report-info">
                <h4>
                  <span className={`hazard-badge hazard-${report.hazard_type}`}>
                    {report.hazard_type}
                  </span>
                  {' '}
                  <span className={`confidence-${getConfidenceLevel(report.upvotes)}`}>
                    {getConfidenceLevel(report.upvotes)} confidence
                  </span>
                </h4>
                <p>{report.description || 'No description'}</p>
                <div className="report-meta">
                  <span>Trail: {report.trail_name || 'Unknown'}</span>
                  <span>Reporter: {report.reporter_email}</span>
                  <span>👍 {report.upvotes} confirms</span>
                  <span>Status: {report.status}</span>
                  <span style={{ color: isExpired(report.expires_at) ? '#dc3545' : '#28a745' }}>
                    {isExpired(report.expires_at) ? 'EXPIRED' : `Expires: ${new Date(report.expires_at).toLocaleDateString()}`}
                  </span>
                </div>
                {report.image_url && (
                  <img 
                    src={report.image_url} 
                    alt="Report" 
                    style={{ maxWidth: '200px', borderRadius: '4px', marginTop: '10px' }} 
                  />
                )}
              </div>
              <div className="report-actions">
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => deleteReport(report.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p>No reports found.</p>}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
