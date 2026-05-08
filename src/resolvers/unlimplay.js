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
        serverName: 'Unlimplay',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const { resolveEmbed } = require('../utils/resolvers.js');
      return await resolveEmbed(iframeMatch[1], signal);
    }

    const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch) {
      return {
        url: videoMatch[1],
        quality: '1080p',
        serverName: 'Unlimplay',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    return null;
  } catch (e) {
    console.error(`[Unlimplay] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
