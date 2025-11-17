import { Router } from 'express';
import bookingController from '../controllers/bookingController';
import { validateRequest } from '../middleware/validator';
import { createBookingSchema } from '../validators/schemas';
import { rateLimit } from '../middleware/rateLimiter';

const router = Router();

// Rate limiting: 10 bookings per 15 minutes
const bookingRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post(
  '/',
  bookingRateLimit,
  validateRequest(createBookingSchema),
  bookingController.createBooking.bind(bookingController)
);

router.get('/', bookingController.getAllBookings.bind(bookingController));

router.get('/:id', bookingController.getBookingById.bind(bookingController));

router.post('/:id/cancel', bookingController.cancelBooking.bind(bookingController));

export default router;