const { getSessionUA } = require('../utils/http.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const domain = new URL(url).origin;

    const resp = await fetch(url, {
      signal,
      headers: {
        'User-Agent': UA,
        Referer: domain + '/',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    if (html.includes('expired') || html.includes('deleted') || html.includes('not found')) {
      console.log(`[Emturbovid] File expired/deleted at ${url}`);
      return null;
    }

    const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: '1080p',
        serverName: 'Emturbovid',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch) {
      return {
        url: videoMatch[1],
        quality: '1080p',
        serverName: 'Emturbovid',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    return null;
  } catch (e) {
    console.error(`[Emturbovid] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
