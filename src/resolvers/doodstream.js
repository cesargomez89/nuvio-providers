const { getSessionUA } = require('../utils/http.js');

const RAND_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomStr(len) {
  let r = '';
  for (let i = 0; i < len; i++)
    r += RAND_CHARS.charAt(Math.floor(Math.random() * RAND_CHARS.length));
  return r;
}

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const urlObj = new URL(url);
    const domain = urlObj.origin;

    const pathMatch = urlObj.pathname.match(/\/[ed]\/([a-z0-9]+)/i);
    if (!pathMatch) return null;
    const videoId = pathMatch[1];

    const embedUrl = `${domain}/e/${videoId}`;

    const resp = await fetch(embedUrl, {
      signal,
      headers: {
        'User-Agent': UA,
        Referer: embedUrl,
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    if (html.includes('Video not found')) {
      console.log('[DoodStream] Video not found');
      return null;
    }

    const passMatch = html.match(/\/pass_md5\/[^'"]+/);
    if (!passMatch) return null;

    const tokenMatch = html.match(/[?&]token=([a-z0-9]+)[&'"]/i);
    if (!tokenMatch) return null;
    const token = tokenMatch[1];

    const passUrl = `${domain}${passMatch[0]}`;
    const passResp = await fetch(passUrl, {
      signal,
      headers: { 'User-Agent': UA, Referer: embedUrl },
    });
    if (!passResp.ok) return null;
    const baseUrl = (await passResp.text()).trim();
    if (!baseUrl || baseUrl.length < 10) return null;

    const expiry = Date.now() * 1000;
    const finalUrl = `${baseUrl}${randomStr(10)}?token=${token}&expiry=${expiry}`;

    return {
      url: finalUrl,
      quality: '1080p',
      serverName: 'DoodStream',
      headers: {
        'User-Agent': UA,
        Referer: domain,
        Origin: domain,
      },
    };
  } catch (e) {
    console.error(`[DoodStream] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
