// import React, { useEffect, useState } from 'react';
// import { bookingsApi } from '../services/api';
// import { Booking } from '../types';
// import { format } from 'date-fns';
// import { Modal } from './Modal';

// interface BookingListProps {
//   onSuccess?: () => void;
//   onError?: (error: string) => void;
// }

// export const BookingList: React.FC<BookingListProps> = ({ onSuccess, onError }) => {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
//     isOpen: false,
//     bookingId: null,
//   });

//   useEffect(() => {
//     loadBookings();
//   }, []);

//   const loadBookings = async () => {
//     try {
//       const data = await bookingsApi.getAll();
//       setBookings(data.sort((a, b) => 
//         new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
//       ));
//     } catch (err: any) {
//       setError(err.message);
//       onError?.(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelClick = (id: string) => {
//     setCancelModal({ isOpen: true, bookingId: id });
//   };

//   const handleCancelConfirm = async () => {
//     if (!cancelModal.bookingId) return;

//     try {
//       await bookingsApi.cancel(cancelModal.bookingId);
//       onSuccess?.();
//       loadBookings();
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.error || 'Failed to cancel booking';
//       onError?.(errorMessage);
//     } finally {
//       setCancelModal({ isOpen: false, bookingId: null });
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading">
//         <div className="spinner"></div>
//         <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading bookings...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="alert alert-error">
//         <span className="alert-icon">❌</span>
//         <div>
//           <strong>Error loading bookings</strong>
//           <p>{error}</p>
//         </div>
//       </div>
//     );
//   }

//   if (bookings.length === 0) {
//     return (
//       <div className="empty-state">
//         <div className="empty-state-icon">📭</div>
//         <h3 className="empty-state-title">No bookings yet</h3>
//         <p>Create your first booking to see it here</p>
//       </div>
//     );
//   }

//   const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
//   const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

//   return (
//     <>
//       <Modal
//         isOpen={cancelModal.isOpen}
//         onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
//         onConfirm={handleCancelConfirm}
//         title="Cancel Booking"
//         message="Are you sure you want to cancel this booking? This action cannot be undone."
//         confirmText="Yes, Cancel Booking"
//         cancelText="No, Keep It"
//         type="danger"
//       />

//       <div>
//         <div style={{ marginBottom: '2rem' }}>
//           <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--dark)', marginBottom: '0.5rem' }}>
//             My Bookings
//           </h2>
//           <p style={{ color: 'var(--text-light)' }}>
//             Manage and track your room reservations
//           </p>
//         </div>

//         <div className="stats-grid">
//           <div className="stat-card">
//             <div className="stat-label">Total Bookings</div>
//             <div className="stat-value">{bookings.length}</div>
//           </div>
//           <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
//             <div className="stat-label">Confirmed</div>
//             <div className="stat-value">{confirmedBookings.length}</div>
//           </div>
//           <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
//             <div className="stat-label">Cancelled</div>
//             <div className="stat-value">{cancelledBookings.length}</div>
//           </div>
//         </div>

//         <div className="table-container">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>Booking ID</th>
//                 <th>Room</th>
//                 <th>User</th>
//                 <th>Start Time</th>
//                 <th>End Time</th>
//                 <th>Price</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {bookings.map((booking) => (
//                 <tr key={booking.id}>
//                   <td>
//                     <code style={{ 
//                       background: 'var(--light)', 
//                       padding: '0.25rem 0.5rem', 
//                       borderRadius: '4px',
//                       fontSize: '0.875rem'
//                     }}>
//                       {booking.id.slice(0, 8)}...
//                     </code>
//                   </td>
//                   <td>
//                     <strong>{booking.roomId}</strong>
//                   </td>
//                   <td>{booking.userName}</td>
//                   <td>{format(new Date(booking.startTime), 'MMM dd, h:mm a')}</td>
//                   <td>{format(new Date(booking.endTime), 'MMM dd, h:mm a')}</td>
//                   <td>
//                     <strong style={{ color: 'var(--primary)' }}>₹{booking.totalPrice}</strong>
//                   </td>
//                   <td>
//                     <span className={`badge ${booking.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-cancelled'}`}>
//                       {booking.status}
//                     </span>
//                   </td>
//                   <td>
//                     {booking.status === 'CONFIRMED' && (
//                       <button 
//                         onClick={() => handleCancelClick(booking.id)}
//                         className="btn btn-danger"
//                         style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
//                       >
//                         Cancel
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </>
//   );
// };




import React, { useEffect, useState } from 'react';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import { format } from 'date-fns';
import { Modal } from './Modal';

interface BookingListProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const BookingList: React.FC<BookingListProps> = ({ onSuccess, onError }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
    isOpen: false,
    bookingId: null,
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingsApi.getAll();
      setBookings(data.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ));
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id: string) => {
    setCancelModal({ isOpen: true, bookingId: id });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal.bookingId) return;

    try {
      await bookingsApi.cancel(cancelModal.bookingId);
      onSuccess?.();
      loadBookings();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to cancel booking';
      onError?.(errorMessage);
    } finally {
      setCancelModal({ isOpen: false, bookingId: null });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-light)', fontWeight: 600 }}>
          Loading bookings...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span className="alert-icon">❌</span>
        <div>
          <strong>Error loading bookings</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <h3 className="empty-state-title">No bookings yet</h3>
        <p>Create your first booking to see it here</p>
      </div>
    );
  }

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <>
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel Booking"
        cancelText="No, Keep It"
        type="danger"
      />

      <div>
        <div className="page-header">
          <h2 className="page-title">
            <span>📋</span>
            My Bookings
          </h2>
          <p className="page-description">
            Manage and track your room reservations
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{bookings.length}</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--gradient-4)' }}>
            <div className="stat-label">Confirmed</div>
            <div className="stat-value">{confirmedBookings.length}</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--gradient-2)' }}>
            <div className="stat-label">Cancelled</div>
            <div className="stat-value">{cancelledBookings.length}</div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Room</th>
                <th>User</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <code style={{ 
                      background: 'var(--light)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {booking.id.slice(0, 8)}...
                    </code>
                  </td>
                  <td>
                    <strong>{booking.roomId}</strong>
                  </td>
                  <td>{booking.userName}</td>
                  <td>{format(new Date(booking.startTime), 'MMM dd, h:mm a')}</td>
                  <td>{format(new Date(booking.endTime), 'MMM dd, h:mm a')}</td>
                  <td>
                    <strong style={{ color: 'var(--primary)' }}>₹{booking.totalPrice}</strong>
                  </td>
                  <td>
                    <span className={`badge ${booking.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    {booking.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => handleCancelClick(booking.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};