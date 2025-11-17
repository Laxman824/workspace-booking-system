import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { RoomList } from './components/RoomList';
import { BookingForm } from './components/BookingForm';
import { BookingList } from './components/BookingList';
import { Analytics } from './components/Analytics';
import { AIBookingAssistant } from './components/AIBookingAssistant';
import { FloatingAIButton } from './components/FloatingAIButton';
import { roomsApi } from './services/api';
import './App.css';

function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="app-nav">
      <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
        🏢 Rooms
      </Link>
      <Link to="/book" className={`nav-link ${isActive('/book') ? 'active' : ''}`}>
        ➕ Book
      </Link>
      <Link to="/bookings" className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}>
        📋 My Bookings
      </Link>
      <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
        📊 Admin
      </Link>
    </nav>
  );
}

function AppContent() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  return (
    <>
      <div className="app-container">
        <div className="app-wrapper">
          <header className="app-header">
            <h1 className="app-title">
               Workspace Booking System
            </h1>
            <p className="app-subtitle">
              Book meeting rooms with AI assistance • Dynamic pricing • Track analytics
            </p>
          </header>
          
          <Navigation />
          
          <main className="app-content">
            <Routes>
              <Route path="/" element={<RoomList />} />
              <Route path="/book" element={<BookingForm />} />
              <Route path="/bookings" element={<BookingList />} />
              <Route path="/admin" element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Floating AI Assistant Button */}
      <FloatingAIButton onClick={() => setShowAIAssistant(true)} />

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <AIBookingAssistant
          rooms={rooms}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;