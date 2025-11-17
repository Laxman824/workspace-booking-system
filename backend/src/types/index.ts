export interface Room {
    id: string;
    name: string;
    baseHourlyRate: number;
    capacity: number;
  }
  
  export interface Booking {
    id: string;
    roomId: string;
    userName: string;
    startTime: Date;
    endTime: Date;
    totalPrice: number;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum BookingStatus {
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED'
  }
  
  export interface CreateBookingDTO {
    roomId: string;
    userName: string;
    startTime: string;
    endTime: string;
  }
  
  export interface AnalyticsQuery {
    from: string;
    to: string;
  }
  
  export interface RoomAnalytics {
    roomId: string;
    roomName: string;
    totalHours: number;
    totalRevenue: number;
  }