import { Room } from '../types';

class RoomModel {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    // Seed initial rooms
    this.seed();
  }

  private seed() {
    const seedRooms: Room[] = [
      { id: '101', name: 'Cabin 1', baseHourlyRate: 200, capacity: 4 },
      { id: '102', name: 'Cabin 2', baseHourlyRate: 300, capacity: 6 },
      { id: '103', name: 'Conference Room A', baseHourlyRate: 500, capacity: 10 },
      { id: '104', name: 'Conference Room B', baseHourlyRate: 400, capacity: 8 },
      { id: '105', name: 'Executive Suite', baseHourlyRate: 800, capacity: 12 },
    ];

    seedRooms.forEach((room) => this.rooms.set(room.id, room));
  }

  async findAll(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async findById(id: string): Promise<Room | null> {
    return this.rooms.get(id) || null;
  }
}

// Export the instance
export const roomModel = new RoomModel();