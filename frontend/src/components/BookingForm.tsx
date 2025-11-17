import React, { useState, useEffect } from 'react';
import { roomsApi, bookingsApi } from '../services/api';
import { Room } from '../types';
import { PriceCalculator } from './PriceCalculator';
import { RoomImage } from './RoomImage';

interface BookingFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onError }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    roomId: '',
    userName: '',
    startTime: '',
    endTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    setDefaultTimes();
  }, []);

  const loadRooms = async () => {
    const data = await roomsApi.getAll();
    setRooms(data);
  };

  const setDefaultTimes = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    
    const start = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
    
    setFormData(prev => ({ ...prev, startTime: start, endTime: end }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomId) {
      newErrors.roomId = 'Please select a room';
    }

    if (!formData.userName.trim()) {
      newErrors.userName = 'Name is required';
    } else if (formData.userName.trim().length < 2) {
      newErrors.userName = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.userName)) {
      newErrors.userName = 'Name must contain only letters';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (start >= end) {
        newErrors.endTime = 'End time must be after start time';
      }

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours > 12) {
        newErrors.endTime = 'Maximum booking duration is 12 hours';
      }

      if (hours < 0.5) {
        newErrors.endTime = 'Minimum booking duration is 30 minutes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onError?.('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const startISO = new Date(formData.startTime).toISOString();
      const endISO = new Date(formData.endTime).toISOString();

      await bookingsApi.create({
        ...formData,
        startTime: startISO,
        endTime: endISO,
      });

      onSuccess?.();
      setFormData({ roomId: '', userName: '', startTime: '', endTime: '' });
      setDefaultTimes();
      setErrors({});
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message;
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === formData.roomId);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <span>📝</span>
          Book a Room
        </h2>
        <p className="page-description">
          Fill in the details below to reserve your perfect workspace
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
        <div className="card" style={{ animation: 'fadeInLeft 0.6s ease' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✍️</span> Booking Details
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">🏢 Select Room *</label>
              <select
                className={`form-select ${errors.roomId ? 'error' : ''}`}
                value={formData.roomId}
                onChange={(e) => {
                  setFormData({ ...formData, roomId: e.target.value });
                  setErrors(prev => ({ ...prev, roomId: '' }));
                }}
              >
                <option value="">Choose a room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - ₹{room.baseHourlyRate}/hr ({room.capacity} people)
                  </option>
                ))}
              </select>
              {errors.roomId && <span className="error-message">{errors.roomId}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">👤 Your Name *</label>
              <input
                type="text"
                className={`form-input ${errors.userName ? 'error' : ''}`}
                value={formData.userName}
                onChange={(e) => {
                  setFormData({ ...formData, userName: e.target.value });
                  setErrors(prev => ({ ...prev, userName: '' }));
                }}
                placeholder="Enter your full name"
              />
              {errors.userName && <span className="error-message">{errors.userName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">🕐 Start Time *</label>
              <input
                type="datetime-local"
                className={`form-input ${errors.startTime ? 'error' : ''}`}
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value });
                  setErrors(prev => ({ ...prev, startTime: '' }));
                }}
              />
              {errors.startTime && <span className="error-message">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">🕐 End Time *</label>
              <input
                type="datetime-local"
                className={`form-input ${errors.endTime ? 'error' : ''}`}
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  setErrors(prev => ({ ...prev, endTime: '' }));
                }}
              />
              {errors.endTime && <span className="error-message">{errors.endTime}</span>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  Processing...
                </>
              ) : (
                <>
                  ✓ Confirm Booking
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {selectedRoom && (
            <div className="selected-room-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', opacity: 0.95 }}>Selected Room</h3>
              
              <div className="selected-room-title">
                {selectedRoom.name}
              </div>

              <div className="selected-room-info">
                <div className="selected-room-detail">
                  <span style={{ fontSize: '1.5rem' }}>👥</span>
                  <div>
                    <strong>Capacity</strong>
                    <div style={{ opacity: 0.9 }}>{selectedRoom.capacity} people</div>
                  </div>
                </div>

                <div className="selected-room-detail">
                  <span style={{ fontSize: '1.5rem' }}>💰</span>
                  <div>
                    <strong>Base Rate</strong>
                    <div style={{ opacity: 0.9 }}>₹{selectedRoom.baseHourlyRate}/hour</div>
                  </div>
                </div>
              </div>

              <div className="pricing-info-box">
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>🌟 Peak Hour Pricing</strong>
                <div style={{ fontSize: '0.9rem', opacity: 0.95, lineHeight: '1.6' }}>
                  Monday - Friday<br />
                  10:00 AM - 1:00 PM & 4:00 PM - 7:00 PM<br />
                  <strong>Rate: ₹{selectedRoom.baseHourlyRate * 1.5}/hour</strong>
                </div>
              </div>
            </div>
          )}

          {selectedRoom && formData.startTime && formData.endTime && (
            <PriceCalculator
              startTime={formData.startTime}
              endTime={formData.endTime}
              baseRate={selectedRoom.baseHourlyRate}
            />
          )}
        </div>
      </div>
    </div>
  );
};