async function resolve(embedUrl, signal = null) {
  try {
    const response = await fetch(embedUrl, {
      signal,
      headers: { Referer: 'https://www.fuegocine.com/' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const m3u8 = html.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
    if (m3u8) {
      return {
        url: m3u8[0],
        quality: 'HD',
        serverName: 'Barmonrey',
        verified: true,
        headers: { Referer: embedUrl },
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { resolve };
