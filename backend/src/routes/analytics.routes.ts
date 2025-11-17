import { Router } from 'express';
import analyticsController from '../controllers/analyticsController';
import { validateQuery } from '../middleware/validator';
import { analyticsQuerySchema } from '../validators/schemas';

const router = Router();

router.get(
  '/',
  validateQuery(analyticsQuerySchema),
  analyticsController.getAnalytics.bind(analyticsController)
);

export default router;