const roomEvents = require('./roomEvents');
const gameEvents = require('./gameEvents');
const hostEvents = require('./hostEvents');
const chatEvents = require('./chatEvents');

module.exports = function setupSocketHandlers(io, roomManager) {
  io.on('connection', (socket) => {
    console.log('connected:', socket.id);
    roomEvents(socket, io, roomManager);
    gameEvents(socket, io, roomManager);
    hostEvents(socket, io, roomManager);
    chatEvents(socket, io, roomManager);
  });
};
