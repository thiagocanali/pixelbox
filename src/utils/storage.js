export const saveScore = (gameId, score) => {
  const scores = JSON.parse(localStorage.getItem('pixelbox_scores') || '{}');
  if (!scores[gameId] || score > scores[gameId]) {
    scores[gameId] = score;
    localStorage.setItem('pixelbox_scores', JSON.stringify(scores));
    return true; // Novo recorde!
  }
  return false;
};

export const getScores = () => {
  return JSON.parse(localStorage.getItem('pixelbox_scores') || '{}');
};