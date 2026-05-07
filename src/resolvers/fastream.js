const UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const { unpackPacker } = require('../utils/packer.js');

async function detectQuality(m3u8Url, headers = {}, signal = null) {
  try {
    const res = await fetch(m3u8Url, {
      signal,
      headers: { "User-Agent": UA, ...headers },
      redirect: "follow"
    });
    const data = await res.text();
    if (!data.includes("#EXT-X-STREAM-INF")) {
      const match = m3u8Url.match(/[_-](\d{3,4})p/);
      return match ? `${match[1]}p` : "1080p";
    }
    let bestHeight = 0;
    const lines = data.split("\n");
    for (const line of lines) {
      const m = line.match(/RESOLUTION=\d+x(\d+)/);
      if (m) {
        const h = parseInt(m[1]);
        if (h > bestHeight)
          bestHeight = h;
      }
    }
    if (bestHeight >= 2160)
      return "4K";
    if (bestHeight >= 1080)
      return "1080p";
    if (bestHeight >= 720)
      return "720p";
    if (bestHeight >= 480)
      return "480p";
    return bestHeight > 0 ? `${bestHeight}p` : "1080p";
  } catch (e) {
    return "1080p";
  }
}

async function resolve(url, signal = null) {
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": "https://www3.seriesmetro.net/"
      },
      redirect: "follow"
    });
    const data = await res.text();
    const unpacked = unpackPacker(data);
    if (!unpacked)
      return null;
    const m3u8 = unpacked.match(/file:"(https?:\/\/[^"]+\.m3u8[^"]*)"/)?.[1];
    if (!m3u8)
      return null;
    const quality = await detectQuality(m3u8, { "Referer": "https://fastream.to/" }, signal);
    return {
      url: m3u8,
      quality,
      headers: { "User-Agent": UA, "Referer": "https://fastream.to/" }
    };
  } catch (e) {
    console.error("[Fastream] Error:", e.message);
    return null;
  }
}

module.exports = { resolve };