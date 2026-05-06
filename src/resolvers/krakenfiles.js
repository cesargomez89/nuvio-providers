const { getSessionUA } = require('../utils/http.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const domain = new URL(url).origin;

    const resp = await fetch(url, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": domain + "/",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    const sourceMatch = html.match(/<source\s+[^>]*src=["']([^"']+)["']/i);
    if (sourceMatch) {
      return {
        url: sourceMatch[1],
        quality: "1080p",
        serverName: "Krakenfiles",
        headers: { "User-Agent": UA, "Referer": domain + "/" }
      };
    }

    const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch) {
      return {
        url: videoMatch[1],
        quality: "1080p",
        serverName: "Krakenfiles",
        headers: { "User-Agent": UA, "Referer": domain + "/" }
      };
    }

    return null;
  } catch (e) {
    console.error(`[Krakenfiles] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
