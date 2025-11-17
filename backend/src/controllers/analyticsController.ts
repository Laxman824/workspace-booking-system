import { Request, Response } from 'express';
import analyticsService from '../services/analyticsService';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          error: 'Both from and to query parameters are required (YYYY-MM-DD)',
        });
      }

      const analytics = await analyticsService.getAnalytics({
        from: from as string,
        to: to as string,
      });

      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AnalyticsController();