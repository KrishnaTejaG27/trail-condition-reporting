import React, { useState, useEffect } from 'react';

function UserProfile({ onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEmail(data.email);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEditing(false);
        setMessage('Profile updated successfully');
        
        // Update local storage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.email = data.email;
        localStorage.setItem('user', JSON.stringify(savedUser));
      } else {
        setMessage('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>👤 User Profile</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>👤 User Profile</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>Error loading profile. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 User Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && (
            <div style={{ 
              background: message.includes('success') ? '#d4edda' : '#f8d7da',
              color: message.includes('success') ? '#155724' : '#721c24',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="form-group">
                <label>User ID</label>
                <input type="text" value={user.id} disabled />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="text" value={user.email} disabled />
              </div>
              <div className="form-group">
                <label>Reputation Score</label>
                <input type="text" value={user.reputation_score} disabled />
              </div>
              <div className="form-group">
                <label>Reports Submitted</label>
                <input type="text" value={user.reports_count} disabled />
              </div>
              <div className="form-group">
                <label>Member Since</label>
                <input type="text" value={new Date(user.created_at).toLocaleDateString()} disabled />
              </div>
              <button className="btn-submit" onClick={() => setEditing(true)}>
                Edit Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
