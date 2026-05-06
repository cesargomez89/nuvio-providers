const { getSessionUA } = require('../utils/http.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();

    const resp = await fetch(url, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": "https://streamtape.com/",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    const innerMatch = html.match(/innerHTML\s*=\s*["']([^"']+?)["']/i);
    if (innerMatch) {
      const decoded = innerMatch[1].replace(/\\/g, "");
      const urlMatch = decoded.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i);
      if (urlMatch) {
        return {
          url: urlMatch[1],
          quality: "1080p",
          serverName: "Streamtape",
          headers: { "User-Agent": UA, "Referer": url }
        };
      }
    }

    const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (fileMatch) {
      return {
        url: fileMatch[1],
        quality: "1080p",
        serverName: "Streamtape",
        headers: { "User-Agent": UA, "Referer": url }
      };
    }

    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const { resolveEmbed } = require('../utils/resolvers.js');
      return await resolveEmbed(iframeMatch[1], signal);
    }

    return null;
  } catch (e) {
    console.error(`[Streamtape] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
