import { RoomAnalytics, AnalyticsQuery } from '../types';
import { bookingModel } from '../models/booking.model';
import { roomModel } from '../models/room.model';
import { getHoursDifference } from '../utils/dateUtils';

export class AnalyticsService {
  async getAnalytics(query: AnalyticsQuery): Promise<RoomAnalytics[]> {
    const { from, to } = query;
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const rooms = await roomModel.findAll();
    const bookings = await bookingModel.findConfirmedInRange(fromDate, toDate);

    // Group bookings by room
    const analytics: RoomAnalytics[] = rooms.map((room) => {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);

      const totalHours = roomBookings.reduce((sum, booking) => {
        return sum + getHoursDifference(booking.startTime, booking.endTime);
      }, 0);

      const totalRevenue = roomBookings.reduce((sum, booking) => {
        return sum + booking.totalPrice;
      }, 0);

      return {
        roomId: room.id,
        roomName: room.name,
        totalHours: Math.round(totalHours * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      };
    });

    return analytics;
  }
}

export default new AnalyticsService();