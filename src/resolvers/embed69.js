const { getSessionUA } = require('../utils/http.js');

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    payload += '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const resp = await fetch(url, {
      signal,
      headers: {
        'User-Agent': UA,
        Referer: 'https://embed69.org/',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Pattern 1: dataLink JSON (primary)
    const dataLinkMatch = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
    if (dataLinkMatch) {
      let rawData;
      try {
        rawData = JSON.parse(dataLinkMatch[1].replace(/\\\//g, '/'));
      } catch {
        return null;
      }
      const items = Array.isArray(rawData) ? rawData : Object.values(rawData);

      for (const item of items) {
        if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds)) continue;
        for (const embed of item.sortedEmbeds) {
          if (!embed.link) continue;
          const payload = decodeJwtPayload(embed.link);
          if (!payload || !payload.link) continue;

          const { resolveEmbed } = require('../utils/resolvers.js');
          const result = await resolveEmbed(payload.link, signal);
          if (result && result.url) return result;
        }
      }
      return null;
    }

    // Pattern 2: direct /d/ download page - inline script extraction
    const fileMatch = html.match(/file["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: '1080p',
        serverName: 'Embed69',
        headers: { 'User-Agent': UA, Referer: url },
      };
    }

    // Pattern 3: iframe redirect
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const { resolveEmbed } = require('../utils/resolvers.js');
      return await resolveEmbed(iframeMatch[1], signal);
    }

    return null;
  } catch (e) {
    console.error(`[Embed69] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
