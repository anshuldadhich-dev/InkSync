const EVENTS = {
  // Room
  ROOM_JOIN: 'room:join',
  ROOM_READY: 'room:ready',
  ROOM_STATE: 'room:state',
  ROOM_PLAYERS_UPDATED: 'room:players-updated',
  ROOM_SETTINGS_UPDATED: 'room:settings-updated',
  ROOM_FULL: 'room:full',
  ROOM_LOCKED: 'room:locked',
  ROOM_HOST_CHANGED: 'room:host-changed',
  ROOM_KICKED: 'room:kicked',
  GAME_IN_PROGRESS: 'room:game-in-progress',

  // Host (client → server)
  HOST_START_GAME: 'host:start-game',
  HOST_END_GAME: 'host:end-game',
  HOST_KICK: 'host:kick',
  HOST_TRANSFER: 'host:transfer',
  HOST_MUTE: 'host:mute',
  HOST_LOCK_ROOM: 'host:lock-room',
  HOST_UPDATE_SETTINGS: 'host:update-settings',

  // Game lifecycle (server → client)
  GAME_STARTED: 'game:started',
  GAME_END: 'game:end',

  // Rounds (server → client)
  ROUND_START: 'round:start',
  ROUND_END: 'round:end',

  // Turns
  TURN_START: 'turn:start',
  TURN_WORD_CHOICES: 'turn:word-choices',
  TURN_CHOOSING: 'turn:choosing',
  TURN_WORD_SELECTED: 'turn:word-selected',
  TURN_DRAWING_START: 'turn:drawing-start',
  TURN_TICK: 'turn:tick',
  TURN_HINT: 'turn:hint',
  TURN_END: 'turn:end',

  // Scores
  SCORE_UPDATE: 'score:update',

  // Chat
  CHAT_GUESS: 'chat:guess',
  CHAT_MESSAGE: 'chat:message',
  CHAT_CORRECT_GUESS: 'chat:correct-guess',

  // Drawing
  DRAW_OP: 'draw:op',
  DRAW_SNAPSHOT: 'draw:snapshot',
  DRAW_UNDO: 'draw:undo',
};

module.exports = { EVENTS };
