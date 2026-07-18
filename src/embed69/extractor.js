import { getSessionUA, setSessionUA } from '../utils/http.js';
import { padEpisode, cleanTmdbId } from '../utils/helpers.js';
import { finalizeStreams } from '../utils/engine.js';
import { getCorrectImdbId } from '../utils/tmdb.js';
import { resolveEmbed } from '../utils/resolvers.js';

const BASE_URL = 'https://embed69.org';
const RESOLVER_TIMEOUT = 10000;

function applyPipingLocal(result) {
  if (!result || !result.url) return result;
  let url = result.url;
  const ua =
    result.headers?.['User-Agent'] ||
    'Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const headers = [
    `User-Agent=${ua}`,
    `Referer=${result.headers?.Referer || 'https://embed69.org/'}`,
  ];
  if (result.headers?.Origin) headers.push(`Origin=${result.headers.Origin}`);
  url = `${url}|${headers.join('|')}`;
  if (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('.mp4')) url += '#.m3u8';
  result.url = url;
  return result;
}

async function resolveWithTimeout(url) {
  if (!url) return null;
  return Promise.race([
    resolveEmbed(url).then((res) =>
      res ? applyPipingLocal(res) : applyPipingLocal({ url, quality: 'HD', verified: false })
    ),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), RESOLVER_TIMEOUT)),
  ]);
}

async function resolveEmbedLocal(url) {
  if (!url) return null;
  console.log(`[Embed69] Resolving: ${url}`);
  try {
    return await resolveWithTimeout(url);
  } catch {
    console.log(`[Embed69] Timeout/failed: ${url.substring(0, 60)}`);
    return null;
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId) return [];
  console.log(`[Embed69] Looking for content: ${tmdbId} (${mediaType})`);
  try {
    const s = season !== undefined && season !== null ? parseInt(season) : null;
    const e = episode !== undefined && episode !== null ? parseInt(episode) : null;
    const currentUA = getSessionUA();
    setSessionUA(currentUA);
    const tmdbIdOnly = cleanTmdbId(tmdbId);
    const imdbInfo = await getCorrectImdbId(tmdbIdOnly, mediaType);
    if (!imdbInfo || !imdbInfo.imdbId) {
      console.log(`[Embed69] No IMDB ID found`);
      return [];
    }
    let displayTitle = title || 'Contenido';
    if (imdbInfo && imdbInfo.title) displayTitle = imdbInfo.title;
    let urlSuffix = imdbInfo.imdbId;
    if (s !== null && e !== null) {
      const epPadded = padEpisode(e);
      urlSuffix = `${imdbInfo.imdbId}-${s}x${epPadded}`;
    }
    const url = `${BASE_URL}/f/${urlSuffix}`;
    console.log(`[Embed69] Searching: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': currentUA, Referer: BASE_URL + '/' },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const match = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
    if (!match) return [];
    let rawData = JSON.parse(match[1].replace(/\\\//g, '/'));
    let data = Array.isArray(rawData) ? rawData : Object.values(rawData);

    const CryptoJS = require('crypto-js');

    const powChallengeMatch = html.match(/POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/);
    const powDifficultyMatch = html.match(/POW_DIFFICULTY\s*=\s*(\d+)/);
    const powSaltMatch = html.match(/POW_SALT\s*=\s*['"]([^'"]+)['"]/);
    if (!powChallengeMatch || !powDifficultyMatch || !powSaltMatch) {
      console.log(`[Embed69] PoW params not found`);
      return [];
    }
    const powChallenge = powChallengeMatch[1];
    const powDifficulty = parseInt(powDifficultyMatch[1]);
    const powSalt = powSaltMatch[1];

    async function solvePoW(challenge, difficulty, signal) {
      const prefix = '0'.repeat(difficulty);
      let nonce = 0;
      const MAX_ITERATIONS = 50000;
      while (nonce < MAX_ITERATIONS) {
        if (signal?.aborted) return null;
        for (let i = 0; i < 100; i++) {
          const hash = CryptoJS.SHA256(challenge + nonce.toString()).toString(CryptoJS.enc.Hex);
          if (hash.startsWith(prefix)) return nonce;
          nonce++;
        }
        await new Promise(r => setTimeout(r, 0));
      }
      console.log(`[Embed69] PoW exceeded ${MAX_ITERATIONS} iterations`);
      return null;
    }

    function deriveKey(challenge, nonce, salt) {
      return CryptoJS.SHA256(challenge + nonce.toString() + salt);
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

    console.log(`[Embed69] Solving PoW (difficulty: ${powDifficulty})...`);
    const nonce = await solvePoW(powChallenge, powDifficulty);
    if (nonce === null) {
      console.log(`[Embed69] PoW failed or aborted`);
      return [];
    }
    const aesKey = deriveKey(powChallenge, nonce, powSalt);
    console.log(`[Embed69] PoW solved (nonce: ${nonce})`);

    const langMap = { LAT: 'Latino', ESP: 'Español', SUB: 'Subtitulado' };
    const langPriority = ['LAT', 'ESP', 'SUB'];

    const byLang = {};
    for (const item of data) {
      const vLang = (item.video_language || 'LAT').toUpperCase();
      byLang[vLang] = item;
    }

    const streams = [];
    for (const lang of langPriority) {
      const item = byLang[lang];
      if (!item) continue;

      const currentLangLabel = langMap[lang] || 'Latino';
      if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds)) continue;

      const embeds = [];
      for (const embed of item.sortedEmbeds) {
        if (!embed.link) continue;
        const decryptedUrl = decryptLink(embed.link, aesKey);
        if (!decryptedUrl || !decryptedUrl.startsWith('http')) {
          console.log(`[Embed69] Decrypt failed for ${embed.servername || 'unknown'}`);
          continue;
        }
        embeds.push({ url: decryptedUrl, servername: embed.servername });
      }

      if (embeds.length === 0) continue;

      console.log(`[Embed69] Resolving ${embeds.length} embeds (${lang})...`);
      const resolvedResults = await Promise.allSettled(
        embeds.map((emb) => resolveEmbedLocal(emb.url))
      );
      const resolved = resolvedResults
        .filter((r) => r.status === 'fulfilled' && r.value && r.value.url)
        .map((r) => r.value)
        .map((result) => ({
          serverName: result.serverName || 'Server',
          audio: currentLangLabel,
          quality: result.quality || 'HD',
          url: result.url,
          headers: result.headers || { 'User-Agent': currentUA },
        }));

      if (resolved.length > 0) {
        streams.push(...resolved);
        console.log(`[Embed69] ✓ Streams found in ${lang}, stopping cascade`);
        break;
      } else {
        console.log(`[Embed69] No streams in ${lang}, trying next language...`);
      }
    }

    return await finalizeStreams(streams, 'Embed69', displayTitle);
  } catch (error) {
    console.error(`[Embed69] Error: ${error.message}`);
    return [];
  }
}
