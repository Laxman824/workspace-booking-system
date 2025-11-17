import { Request, Response } from 'express';
import bookingService from '../services/bookingService';

export class BookingController {
  async createBooking(req: Request, res: Response) {
    try {
      const booking = await bookingService.createBooking(req.body);
      
      res.status(201).json({
        bookingId: booking.id,
        roomId: booking.roomId,
        userName: booking.userName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already booked') ? 409 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  }

  async cancelBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await bookingService.cancelBooking(id);
      
      res.json({
        message: 'Booking cancelled successfully',
        bookingId: id,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Booking not found' ? 404 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  }

  async getAllBookings(req: Request, res: Response) {
    try {
      const bookings = await bookingService.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // NEW METHOD
  async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new BookingController();