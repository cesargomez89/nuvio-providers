const QUALITY_SCORE = {
  '4K': 100,
  '1440p': 90,
  '1080p': 80,
  '720p': 70,
  '480p': 60,
  '360p': 50,
  '240p': 40,
  Auto: 30,
  Unknown: 0,
};

const SERVER_SCORE = {
  VOE: 10,
  Filemoon: 10,
  Tplayer: 10,
  Vimeos: 10,
  Netu: 5,
  GoodStream: 10,
  StreamWish: -5,
  VidHide: -5,
  Supervideo: 10,
};

function sortStreamsByQuality(streams) {
  if (!Array.isArray(streams)) return [];
  return [...streams].sort((a, b) => {
    const scoreA = QUALITY_SCORE[a.quality] || 0;
    const scoreB = QUALITY_SCORE[b.quality] || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const serverA = (a.serverLabel || '').split(' ')[0];
    const serverB = (b.serverLabel || '').split(' ')[0];
    const speedA = SERVER_SCORE[serverA] || 0;
    const speedB = SERVER_SCORE[serverB] || 0;
    if (speedA !== speedB) {
      return speedB - speedA;
    }
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });
}

module.exports = { sortStreamsByQuality };
