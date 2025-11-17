import React, { useEffect, useState } from 'react';
import { roomsApi } from '../services/api';
import { Room } from '../types';

export const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span className="alert-icon">❌</span>
        <div>
          <strong>Error loading rooms</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--dark)', marginBottom: '0.5rem' }}>
          Available Rooms
        </h2>
        <p style={{ color: 'var(--text-light)' }}>
          Choose from our premium meeting spaces
        </p>
      </div>

      <div className="grid grid-cols-3">
        {rooms.map((room) => (
          <div key={room.id} className="card room-card">
            <div className="room-name">{room.name}</div>
            
            <div className="room-detail">
              <span>🆔</span>
              <span>Room {room.id}</span>
            </div>
            
            <div className="room-detail">
              <span>👥</span>
              <span>{room.capacity} people</span>
            </div>
            
            <div className="room-price">
              ₹{room.baseHourlyRate}
              <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-light)' }}>
                /hour
              </span>
            </div>
            
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              background: 'var(--light)', 
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-light)'
            }}>
              💡 Peak hours: 1.5× rate (Mon-Fri, 10AM-1PM & 4PM-7PM)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};