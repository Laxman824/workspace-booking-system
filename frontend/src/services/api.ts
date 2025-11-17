import axios from 'axios';
import { Room, Booking, CreateBookingRequest, RoomAnalytics } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const response = await api.get('/api/rooms');
    return response.data;
  },
};

export const bookingsApi = {
  create: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await api.post('/api/bookings', data);
    return response.data;
  },

  getAll: async (): Promise<Booking[]> => {
    const response = await api.get('/api/bookings');
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/api/bookings/${id}/cancel`);
  },
};

export const analyticsApi = {
  get: async (from: string, to: string): Promise<RoomAnalytics[]> => {
    const response = await api.get('/api/analytics', {
      params: { from, to },
    });
    return response.data;
  },
};