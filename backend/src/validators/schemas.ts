import { z } from 'zod';

export const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  userName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return start < end;
}, {
  message: 'Start time must be before end time',
  path: ['endTime'],
});

export const analyticsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
}).refine((data) => {
  const from = new Date(data.from);
  const to = new Date(data.to);
  return from <= to;
}, {
  message: 'From date must be before or equal to To date',
  path: ['to'],
});