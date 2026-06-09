const history = new Map();
const MAX_MSGS = 8;
const WINDOW_MS = 5000;

function isRateLimited(socketId) {
  const now = Date.now();
  const timestamps = (history.get(socketId) || []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_MSGS) return true;
  history.set(socketId, [...timestamps, now]);
  return false;
}

function cleanup(socketId) {
  history.delete(socketId);
}

module.exports = { isRateLimited, cleanup };
