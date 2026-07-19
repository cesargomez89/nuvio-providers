const { getSessionUA } = require('../utils/http.js');

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
      const items = Array.isArray(rawData) ? rawData : Object.keys(rawData).map(k => rawData[k]);

      const CryptoJS = require('crypto-js');
      const powChallengeMatch = html.match(/POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/);
      const powDifficultyMatch = html.match(/POW_DIFFICULTY\s*=\s*(\d+)/);
      const powSaltMatch = html.match(/POW_SALT\s*=\s*['"]([^'"]+)['"]/);
      if (!powChallengeMatch || !powDifficultyMatch || !powSaltMatch) return null;
      const powChallenge = powChallengeMatch[1];
      const powDifficulty = parseInt(powDifficultyMatch[1]);
      const powSalt = powSaltMatch[1];

      function solvePoW(challenge, difficulty) {
        const prefix = '0'.repeat(difficulty);
        let nonce = 0;
        const MAX_ITERATIONS = 500000;
        while (nonce < MAX_ITERATIONS) {
          const hash = CryptoJS.SHA256(challenge + nonce.toString()).toString(CryptoJS.enc.Hex);
          if (hash.startsWith(prefix)) return nonce;
          nonce++;
        }
        console.log(`[Embed69] PoW exceeded ${MAX_ITERATIONS} iterations`);
        return null;
      }

      function decryptLink(encryptedBase64, key) {
        const raw = CryptoJS.enc.Base64.parse(encryptedBase64);
        const iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
        const ct = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
        const decrypted = CryptoJS.AES.decrypt({ ciphertext: ct }, key, {
          iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
      }

      const nonce = solvePoW(powChallenge, powDifficulty);
      if (nonce === null) return null;
      const aesKey = CryptoJS.SHA256(powChallenge + nonce.toString() + powSalt);

      for (const item of items) {
        if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds)) continue;
        for (const embed of item.sortedEmbeds) {
          if (!embed.link) continue;
          const decryptedUrl = decryptLink(embed.link, aesKey);
          if (!decryptedUrl || !decryptedUrl.startsWith('http')) continue;

          const { resolveEmbed } = require('../utils/resolvers.js');
          const result = await resolveEmbed(decryptedUrl, signal);
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
