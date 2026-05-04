function normalizeTitle(t) {
  if (!t) return '';
  return t.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleMatch(query, target, minRatio = 0.8) {
  const q = normalizeTitle(query);
  const t = normalizeTitle(target);
  if (!q || !t) return false;
  if (q === t) return true;
  const qWords = q.split(' ').filter(w => w.length > 2);
  const tWords = t.split(' ');
  if (qWords.length === 0) return q === t;
  const matchCount = qWords.filter(w => tWords.includes(w)).length;
  const ratio = matchCount / qWords.length;
  return ratio >= minRatio;
}

function levenshtein(a, b) {
  if (!a || !b) return Math.max((a || "").length, (b || "").length);
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

module.exports = { normalizeTitle, titleMatch, levenshtein };