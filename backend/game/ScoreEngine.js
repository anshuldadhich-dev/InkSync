const BASE_POINTS = 500;
const MIN_POINTS = 50;
const FIRST_GUESSER_BONUS = 200;
const DRAWER_PER_GUESSER = 50;
const DRAWER_ALL_BONUS = 100;

function calcGuesserPoints(drawTime, timeRemaining, position) {
  const ratio = Math.max(0, timeRemaining / drawTime);
  const timePoints = Math.round(MIN_POINTS + (BASE_POINTS - MIN_POINTS) * ratio);
  const posBonus = position === 0 ? FIRST_GUESSER_BONUS : 0;
  return timePoints + posBonus;
}

function calcDrawerPoints(correctGuessCount, totalGuessers) {
  if (correctGuessCount === 0) return 0;
  const perGuesser = correctGuessCount * DRAWER_PER_GUESSER;
  const allBonus = correctGuessCount >= totalGuessers ? DRAWER_ALL_BONUS : 0;
  return perGuesser + allBonus;
}

module.exports = { calcGuesserPoints, calcDrawerPoints };
