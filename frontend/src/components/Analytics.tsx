import React, { useState } from 'react';
import { analyticsApi } from '../services/api';
import { RoomAnalytics } from '../types';
import { format } from 'date-fns';

export const Analytics: React.FC = () => {
  const [from, setFrom] = useState(format(new Date(), 'yyyy-MM-01'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState<RoomAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await analyticsApi.get(from, to);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, room) => sum + room.totalRevenue, 0);
  const totalHours = data.reduce((sum, room) => sum + room.totalHours, 0);
  const avgUtilization = data.length > 0 ? (totalHours / data.length).toFixed(2) : 0;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <span>📊</span>
          Analytics Dashboard
        </h2>
        <p className="page-description">
          Track room utilization and revenue metrics
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: '600', fontSize: '1.25rem' }}>
          📅 Select Date Range
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button onClick={handleFetch} disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Loading...
              </>
            ) : (
              <>
                📊 Fetch Analytics
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <div>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{totalRevenue.toFixed(2)}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--gradient-5)' }}>
              <div className="stat-label">Total Hours</div>
              <div className="stat-value">{totalHours.toFixed(1)}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--gradient-4)' }}>
              <div className="stat-label">Avg Hours/Room</div>
              <div className="stat-value">{avgUtilization}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--gradient-2)' }}>
              <div className="stat-label">Active Rooms</div>
              <div className="stat-value">{data.filter(r => r.totalHours > 0).length}</div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Room ID</th>
                  <th>Room Name</th>
                  <th>Total Hours</th>
                  <th>Total Revenue</th>
                  <th>Avg Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((room) => (
                  <tr key={room.roomId}>
                    <td>
                      <code style={{ 
                        background: 'var(--light)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px'
                      }}>
                        {room.roomId}
                      </code>
                    </td>
                    <td><strong>{room.roomName}</strong></td>
                    <td>
                      <span style={{ color: 'var(--warning)' }}>
                        ⏱️ {room.totalHours.toFixed(2)} hrs
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--success)', fontSize: '1.125rem' }}>
                        ₹{room.totalRevenue.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      ₹{room.totalHours > 0 ? (room.totalRevenue / room.totalHours).toFixed(2) : '0'}/hr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">No data yet</h3>
          <p>Select a date range and click "Fetch Analytics" to view reports</p>
        </div>
      )}
    </div>
  );
};