import React, { useState } from 'react';

function ReportForm({ trail, userLocation, onClose, onSubmit }) {
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const hazardTypes = [
    { id: 'mud', label: 'Mud / Slippery', icon: '💩', color: '#8B4513' },
    { id: 'flooding', label: 'Water / Flooding', icon: '💧', color: '#0066cc' },
    { id: 'ice', label: 'Ice / Snow', icon: '❄️', color: '#87CEEB' },
    { id: 'fallen_tree', label: 'Fallen Tree / Obstruction', icon: '🌳', color: '#ff8c00' },
    { id: 'closed_trail', label: 'Trail Closed', icon: '🚫', color: '#dc3545' },
    { id: 'other', label: 'Other', icon: '⚠️', color: '#6c757d' }
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hazardType) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('trail_id', trail?.id || '');
      formData.append('hazard_type', hazardType);
      formData.append('description', description);
      formData.append('lat', trail?.latitude || userLocation.lat);
      formData.append('lng', trail?.longitude || userLocation.lng);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        onSubmit();
      } else {
        alert('Error submitting report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Error submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeEstimate = () => {
    // PRD: All reports expire after 48 hours
    return '48 hours';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Report Hazard</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {trail && (
              <div className="form-group">
                <label>Trail</label>
                <input type="text" value={trail.name} disabled />
              </div>
            )}

            <div className="form-group">
              <label>Select Hazard Type *</label>
              <div className="hazard-grid">
                {hazardTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={`hazard-btn ${hazardType === type.id ? 'selected' : ''}`}
                    style={{ borderColor: hazardType === type.id ? type.color : undefined }}
                    onClick={() => setHazardType(type.id)}
                  >
                    <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>
                      {type.icon}
                    </span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {hazardType && (
              <div className="form-group">
                <label style={{ fontSize: '12px', color: '#666' }}>
                  ⏱️ This report will expire in: <strong>{getTimeEstimate()}</strong>
                </label>
              </div>
            )}

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (max 100 chars)"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Photo (Optional)</label>
              <div className="image-upload" onClick={() => document.getElementById('image-input').click()}>
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                    <div>Tap to take photo or upload</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      Photos increase report credibility
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={!hazardType || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;
