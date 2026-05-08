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

    // Pattern 1: direct file: source (common in embed pages)
    const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: '1080p',
        serverName: 'Xupalace',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    // Pattern 2: iframe with redirect
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const { resolveEmbed } = require('../utils/resolvers.js');
      return await resolveEmbed(iframeMatch[1], signal);
    }

    // Pattern 3: redirect via location.href
    const redirectMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
    if (redirectMatch) {
      const { resolveEmbed } = require('../utils/resolvers.js');
      return await resolveEmbed(redirectMatch[1], signal);
    }

    // Pattern 4: og:video meta
    const ogMatch = html.match(/og:video[^>]+content=["']([^"']+)["']/i);
    if (ogMatch) {
      return {
        url: ogMatch[1],
        quality: '1080p',
        serverName: 'Xupalace',
        headers: { 'User-Agent': UA, Referer: domain + '/' },
      };
    }

    return null;
  } catch (e) {
    console.error(`[Xupalace] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
