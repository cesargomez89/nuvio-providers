const CryptoJS = require('crypto-js');

async function resolve(embedUrl, signal = null) {
  try {
    const id = embedUrl.split('/').pop().replace('.html', '');
    const isUpns = embedUrl.includes('upns');
    const apiDomain = isUpns ? 'https://fuegocineplayer.upns.online' : 'https://rpmvid.com';
    const apiUrl = `${apiDomain}/api/v1/video`;
    const bodyStr = `url=${encodeURIComponent(id)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: embedUrl,
      },
      body: bodyStr,
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 'success' || !data.payload) return null;
    const key = CryptoJS.enc.Utf8.parse('kiemtienmua911ca');
    const iv = CryptoJS.enc.Utf8.parse('1234567890oiuytr');
    const decrypted = CryptoJS.AES.decrypt(data.payload, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    const payload = JSON.parse(decrypted);
    let videoUrl =
      payload.url || (payload.sources && payload.sources[0] && payload.sources[0].file);
    if (videoUrl) {
      if (videoUrl.includes('.txt')) videoUrl += '#index.m3u8';
      return {
        url: videoUrl,
        quality: 'HD',
        serverName: isUpns ? 'UPNS' : 'Rpmvid',
        verified: true,
        headers: { Referer: apiDomain },
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { resolve };
