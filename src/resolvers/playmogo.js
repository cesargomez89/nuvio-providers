const { DEFAULT_UA } = require('../utils/http.js');

async function resolve(url) {
  try {
    console.log('[Playmogo] Resolving: ' + url);
    return {
      url,
      verified: true,
      serverName: 'Playmogo',
      headers: {
        'User-Agent': DEFAULT_UA,
        Referer: 'https://dsvplay.com/',
        Origin: 'https://dsvplay.com',
      },
    };
  } catch (e) {
    console.error('[Playmogo] Error: ' + e.message);
    return null;
  }
}

module.exports = { resolve };
