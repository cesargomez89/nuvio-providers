const { detectQuality } = require('./quality.js');
const { getSessionUA } = require('../utils/http.js');

async function resolve(embedUrl, signal = null) {
  try {
    const UA = getSessionUA();
    console.log(`[GoodStream] Resolviendo: ${embedUrl}`);
    const response = await fetch(embedUrl, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": "https://goodstream.one/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9",
        "Connection": "keep-alive"
      }
    });
    const data = await response.text();
    const match = data.match(/file:\s*"([^"]+)"/);
    if (!match) {
      console.log('[GoodStream] No se encontró patrón file:"..."');
      return null;
    }
    const videoUrl = match[1];
    const refererHeaders = {
      "Referer": embedUrl,
      "Origin": "https://goodstream.one",
      "User-Agent": UA,
      "Accept-Language": "es-MX,es;q=0.9"
    };
    const quality = await detectQuality(videoUrl, refererHeaders);
    console.log(`[GoodStream] URL encontrada (${quality}): ${videoUrl.substring(0, 80)}...`);
    return {
      url: videoUrl,
      quality: quality || "1080p",
      verified: !!quality,
      serverName: "GoodStream",
      headers: refererHeaders
    };
  } catch (err) {
    console.log(`[GoodStream] Error: ${err.message}`);
    return null;
  }
}

module.exports = { resolve };