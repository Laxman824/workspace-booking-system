import { Request, Response } from 'express';
import { roomModel } from '../models/room.model';

export class RoomController {
  async getAllRooms(req: Request, res: Response) {
    try {
      const rooms = await roomModel.findAll();
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new RoomController();