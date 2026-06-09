const { EVENTS } = require('../constants/events');
const { selectWord, endTurn } = require('../game/GameEngine');

module.exports = function gameEvents(socket, io, roomManager) {
  socket.on(EVENTS.TURN_WORD_SELECTED, ({ word } = {}) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room) return;
    if (room.phase !== 'choosing') return;
    const drawer = room.getCurrentDrawer();
    if (!drawer || drawer.id !== socket.id) return;
    if (!room.wordChoices || !room.wordChoices.includes(word)) return;
    selectWord(room, roomCode, io, roomManager, word);
  });

  socket.on(EVENTS.DRAW_OP, (op) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room || room.phase !== 'drawing') return;
    const drawer = room.getCurrentDrawer();
    if (!drawer || drawer.id !== socket.id) return;
    room.drawOpLog.push(op);
    socket.to(roomCode).emit(EVENTS.DRAW_OP, op);
  });

  socket.on(EVENTS.DRAW_UNDO, () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = roomManager.get(roomCode);
    if (!room || room.phase !== 'drawing') return;
    const drawer = room.getCurrentDrawer();
    if (!drawer || drawer.id !== socket.id) return;
    room.drawOpLog.pop();
    // Broadcast full op log so other clients can replay
    socket.to(roomCode).emit(EVENTS.DRAW_SNAPSHOT, { ops: room.drawOpLog });
  });
};
