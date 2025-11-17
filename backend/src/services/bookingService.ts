import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingStatus, CreateBookingDTO } from '../types';
import { bookingModel } from '../models/booking.model';
import { roomModel } from '../models/room.model';
import pricingService from './pricingService';
import { formatTimeForError, getHoursDifference } from '../utils/dateUtils';

export class BookingService {
  private readonly MAX_BOOKINGS_PER_DAY = 5; // Business rule: max 5 bookings per day per user
  private readonly MAX_DURATION_HOURS = 12;
  private readonly MIN_DURATION_MINUTES = 30;
  private readonly MAX_ADVANCE_BOOKING_DAYS = 90; // Can't book more than 90 days in advance

  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    const { roomId, userName, startTime: startTimeStr, endTime: endTimeStr } = data;

    // Validate room exists
    const room = await roomModel.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    // Comprehensive validation
    this.validateBookingTimes(startTime, endTime);
    await this.validateUserBookingLimit(userName, startTime);
    await this.validateAdvanceBooking(startTime);

    // Check for conflicts with grace period
    await this.checkConflicts(roomId, startTime, endTime);

    // Calculate price
    const totalPrice = pricingService.calculatePrice(
      startTime,
      endTime,
      room.baseHourlyRate
    );

    // Create booking
    const booking: Booking = {
      id: uuidv4(),
      roomId,
      userName: userName.trim(),
      startTime,
      endTime,
      totalPrice,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await bookingModel.create(booking);

    return booking;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking already cancelled');
    }

    // Check if booking has already started
    const now = new Date();
    if (now >= booking.startTime) {
      throw new Error('Cannot cancel a booking that has already started');
    }

    // Check if cancellation is allowed (>2 hours before start)
    const hoursUntilStart = getHoursDifference(now, booking.startTime);

    if (hoursUntilStart <= 2) {
      throw new Error(
        `Cannot cancel booking less than 2 hours before start time. Time remaining: ${hoursUntilStart.toFixed(1)} hours`
      );
    }

    await bookingModel.updateStatus(bookingId, BookingStatus.CANCELLED);
  }

  async getAllBookings(): Promise<Booking[]> {
    return bookingModel.findAll();
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return bookingModel.findById(id);
  }

  /**
   * Validate booking times with comprehensive checks
   */
  private validateBookingTimes(startTime: Date, endTime: Date): void {
    // Check for valid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid date format');
    }

    // Check start < end
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    // Check not in the past
    const now = new Date();
    if (startTime < now) {
      throw new Error('Cannot book in the past');
    }

    // Check minimum duration (30 minutes)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes < this.MIN_DURATION_MINUTES) {
      throw new Error(`Minimum booking duration is ${this.MIN_DURATION_MINUTES} minutes`);
    }

    // Check maximum duration
    const hours = getHoursDifference(startTime, endTime);
    if (hours > this.MAX_DURATION_HOURS) {
      throw new Error(`Booking duration cannot exceed ${this.MAX_DURATION_HOURS} hours`);
    }

    // Check business hours (optional - can be configured)
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    if (startHour < 6 || startHour >= 23) {
      throw new Error('Bookings must start between 6:00 AM and 11:00 PM');
    }
    
    if (endHour > 23 || (endHour === 23 && endTime.getMinutes() > 0)) {
      throw new Error('Bookings must end by 11:00 PM');
    }
  }

  /**
   * Validate user hasn't exceeded daily booking limit
   */
  private async validateUserBookingLimit(userName: string, bookingDate: Date): Promise<void> {
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const allBookings = await bookingModel.findAll();
    const userBookingsToday = allBookings.filter(
      (b) =>
        b.userName.toLowerCase() === userName.toLowerCase() &&
        b.status === BookingStatus.CONFIRMED &&
        b.startTime >= startOfDay &&
        b.startTime <= endOfDay
    );

    if (userBookingsToday.length >= this.MAX_BOOKINGS_PER_DAY) {
      throw new Error(
        `Maximum ${this.MAX_BOOKINGS_PER_DAY} bookings per day exceeded for user ${userName}`
      );
    }
  }

  /**
   * Validate booking is not too far in advance
   */
  private async validateAdvanceBooking(startTime: Date): Promise<void> {
    const now = new Date();
    const daysInAdvance = getHoursDifference(now, startTime) / 24;

    if (daysInAdvance > this.MAX_ADVANCE_BOOKING_DAYS) {
      throw new Error(
        `Cannot book more than ${this.MAX_ADVANCE_BOOKING_DAYS} days in advance`
      );
    }
  }

  /**
   * Check for booking conflicts
   */
  private async checkConflicts(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<void> {
    const existingBookings = await bookingModel.findByRoomAndTimeRange(
      roomId,
      startTime,
      endTime
    );

    const conflicts = existingBookings.filter(
      (booking) =>
        booking.status === BookingStatus.CONFIRMED &&
        booking.id !== excludeBookingId &&
        // Conflict if: new starts before existing ends AND new ends after existing starts
        startTime < booking.endTime &&
        endTime > booking.startTime
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const conflictStart = formatTimeForError(conflict.startTime);
      const conflictEnd = formatTimeForError(conflict.endTime);
      throw new Error(
        `Room already booked from ${conflictStart} to ${conflictEnd}`
      );
    }
  }
}

export default new BookingService();