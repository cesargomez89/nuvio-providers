const { getSessionUA } = require('../utils/http.js');

async function resolve(url) {
  try {
    const UA = getSessionUA();
    const pathMatch = url.match(/pixeldrain\.com\/u\/([a-zA-Z0-9]+)/i);
    if (!pathMatch) return null;
    const fileId = pathMatch[1];
    const directUrl = `https://pixeldrain.com/api/file/${fileId}`;
    return {
      url: directUrl,
      quality: '1080p',
      serverName: 'Pixeldrain',
      headers: {
        'User-Agent': UA,
        Referer: 'https://pixeldrain.com/',
        Origin: 'https://pixeldrain.com',
      },
    };
  } catch (e) {
    console.error(`[Pixeldrain] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
