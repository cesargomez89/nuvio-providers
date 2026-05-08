async function resolve(embedUrl, signal = null) {
  try {
    const response = await fetch(embedUrl, {
      signal,
      headers: {
        "Referer": "https://www.fuegocine.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const m3u8 = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
    if (m3u8) {
      return {
        url: m3u8[0],
        quality: "HD",
        serverName: "Server",
        verified: true,
        headers: { "Referer": embedUrl }
      };
    }
    const mp4 = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
    if (mp4) {
      return {
        url: mp4[0],
        quality: "HD",
        serverName: "Server",
        verified: true,
        headers: { "Referer": embedUrl }
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { resolve };
