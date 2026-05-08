async function resolve(embedUrl, signal = null) {
  try {
    const urlObj = new URL(embedUrl);
    const redirectBase = 'https://vidmoly.to';
    const videoId = urlObj.pathname.split('/').pop().replace('.html', '').replace('embed-', '');
    const targetUrl = `${redirectBase}/embed-${videoId}.html`;
    const response = await fetch(targetUrl, {
      signal,
      headers: {
        Referer: redirectBase + '/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/);
    if (match && match[1]) {
      return {
        url: match[1],
        quality: 'HD',
        serverName: 'Vidmoly',
        verified: true,
        headers: {
          Referer: targetUrl,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { resolve };
