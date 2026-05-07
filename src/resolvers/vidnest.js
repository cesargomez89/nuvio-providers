async function resolve(embedUrl, signal = null) {
  try {
    const response = await fetch(embedUrl, {
      signal,
      headers: { "Referer": "https://www.fuegocine.com/" }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/sources\s*:\s*\[\s*\{[^}]*file\s*:\s*"([^"]+\.mp4[^"]*)"/);
    if (match && match[1]) {
      return {
        url: match[1],
        quality: "HD",
        serverName: "VidNest",
        verified: true,
        headers: { "Referer": embedUrl }
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = { resolve };
