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

    if (html.includes("signup") || html.includes("register") || html.includes("login")) {
      console.log(`[Verhdlink] Signup gate detected — cannot extract video`);
      return null;
    }

    const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: "1080p",
        serverName: "Verhdlink",
        headers: { "User-Agent": UA, "Referer": domain + "/" }
      };
    }

    const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch) {
      return {
        url: videoMatch[1],
        quality: "1080p",
        serverName: "Verhdlink",
        headers: { "User-Agent": UA, "Referer": domain + "/" }
      };
    }

    return null;
  } catch (e) {
    console.error(`[Verhdlink] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
