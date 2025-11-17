import { Booking, BookingStatus } from '../types';

class BookingModel {
  private bookings: Map<string, Booking> = new Map();

  async create(booking: Booking): Promise<Booking> {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) || null;
  }

  async findAll(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async findByRoomAndTimeRange(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) =>
        booking.roomId === roomId &&
        booking.startTime < endTime &&
        booking.endTime > startTime
    );
  }

  async findConfirmedInRange(from: Date, to: Date): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) =>
        booking.status === BookingStatus.CONFIRMED &&
        booking.startTime >= from &&
        booking.endTime <= to
    );
  }

  async updateStatus(id: string, status: BookingStatus): Promise<void> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date();
    }
  }
}

// Export the instance
export const bookingModel = new BookingModel();