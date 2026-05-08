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

    const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: '1080p',
        serverName: 'PlayHydrax',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    const sourcesMatch = html.match(/sources\s*:\s*\[[^\]]*?file\s*:\s*["']([^"']+)["']/i);
    if (sourcesMatch) {
      return {
        url: sourcesMatch[1],
        quality: '1080p',
        serverName: 'PlayHydrax',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    return null;
  } catch (e) {
    console.error(`[PlayHydrax] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
