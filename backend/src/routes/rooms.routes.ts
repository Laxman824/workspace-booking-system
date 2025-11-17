import { Router } from 'express';
import roomController from '../controllers/roomController';

const router = Router();

router.get('/', roomController.getAllRooms.bind(roomController));

export default router;