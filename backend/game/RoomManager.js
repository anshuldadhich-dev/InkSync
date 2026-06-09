const Room = require('./Room');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  create(code) {
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    return this.rooms.get(code) || null;
  }

  getOrCreate(code) {
    return this.rooms.has(code) ? this.rooms.get(code) : this.create(code);
  }

  delete(code) {
    const room = this.rooms.get(code);
    if (room) {
      room.clearTimers();
      this.rooms.delete(code);
    }
  }

  exists(code) {
    return this.rooms.has(code);
  }
}

module.exports = { RoomManager };
