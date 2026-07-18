import { fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle } from '../utils/tmdb.js';
import { cleanTmdbId, padEpisode } from '../utils/helpers.js';
import { titleMatch } from '../utils/title.js';

const BASE_URL = 'https://flixlatam.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8' };

function parseSearchResults(html) {
  const cheerio = require('cheerio-without-node-native');
  const $ = cheerio.load(html);
  const results = [];
  $('article.item').each((_, el) => {
    const $el = $(el);
    const link = $el.find('h3 a');
    const href = link.attr('href');
    const title = link.text().trim();
    const yearText = $el.find('span').text().trim();
    if (href && title) results.push({ href, title, year: yearText });
  });
  return results;
}

function findMatch(results, searchTitle) {
  for (const r of results) {
    if (titleMatch(searchTitle, r.title)) return r;
  }
  return null;
}

function determineTypeFromPath(path) {
  const urlPath = path.startsWith('http') ? new URL(path).pathname : path;
  if (urlPath.startsWith('/pelicula/')) return 'movie';
  if (urlPath.startsWith('/serie/')) return 'serie';
  if (urlPath.startsWith('/anime/')) return 'anime';
  return null;
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId) return [];
  console.log(`[FlixLatam] Looking for content: ${tmdbId} (${mediaType})`);
  try {
    const realId = cleanTmdbId(tmdbId);
    const s = season !== undefined && season !== null ? parseInt(season) : null;
    const e = episode !== undefined && episode !== null ? parseInt(episode) : null;

    let searchTitle = title;
    if (!searchTitle) searchTitle = await getTmdbTitle(realId, mediaType);
    if (!searchTitle) {
      console.log(`[FlixLatam] No title found for ${realId}`);
      return [];
    }

    console.log(`[FlixLatam] Searching for: "${searchTitle}"`);
    const searchUrl = `${BASE_URL}/search?s=${encodeURIComponent(searchTitle)}`;
    const searchHtml = await fetchHtml(searchUrl, { headers: HEADERS });

    const results = parseSearchResults(searchHtml);
    if (results.length === 0) {
      console.log(`[FlixLatam] No search results found`);
      return [];
    }

    const match = findMatch(results, searchTitle);
    if (!match) {
      console.log(`[FlixLatam] No title match for "${searchTitle}"`);
      return [];
    }

    const contentType = determineTypeFromPath(match.href);
    if (!contentType) {
      console.log(`[FlixLatam] Unknown content type in path: ${match.href}`);
      return [];
    }

    console.log(`[FlixLatam] Matched: ${match.title} (${contentType}) -> ${match.href}`);

    const contentPath = match.href.startsWith('http') ? new URL(match.href).pathname : match.href;
    let contentUrl = `${BASE_URL}${contentPath}`;
    if (contentType !== 'movie' && s !== null && e !== null) {
      const ep = padEpisode(e);
      contentUrl = `${BASE_URL}${contentPath.replace(/\/$/, '')}/temporada/${s}/capitulo/${ep}/`;
    }

    console.log(`[FlixLatam] Fetching content page: ${contentUrl}`);
    const contentHtml = await fetchHtml(contentUrl, {
      headers: { ...HEADERS, Referer: searchUrl },
    });

    const iframeMatch = contentHtml.match(/<iframe[^>]*src=["']([^"']*\/vidurl\/([^"']+?))["']/i);
    if (!iframeMatch) {
      console.log(`[FlixLatam] No vidurl iframe found`);
      return [];
    }
    const vidurlPath = iframeMatch[1].startsWith('http')
      ? iframeMatch[1]
      : `${BASE_URL}${iframeMatch[1]}`;
    console.log(`[FlixLatam] Vidurl: ${vidurlPath}`);

    const vidurlHtml = await fetchHtml(vidurlPath, {
      headers: { ...HEADERS, Referer: contentUrl },
    });

    const challengeMatch = vidurlHtml.match(/const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/);
    const difficultyMatch = vidurlHtml.match(/const\s+POW_DIFFICULTY\s*=\s*(\d+)/);
    const saltMatch = vidurlHtml.match(/const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/);
    if (!challengeMatch || !difficultyMatch || !saltMatch) {
      console.log(`[FlixLatam] PoW params not found`);
      return [];
    }
    const powChallenge = challengeMatch[1];
    const powDifficulty = parseInt(difficultyMatch[1]);
    const powSalt = saltMatch[1];

    const dataLinkMatch = vidurlHtml.match(/(?:let|const|var)\s+dataLink\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (!dataLinkMatch) {
      console.log(`[FlixLatam] dataLink not found`);
      return [];
    }
    let dataLink;
    try {
      dataLink = JSON.parse(dataLinkMatch[1].replace(/\\\//g, '/'));
    } catch {
      console.log(`[FlixLatam] Failed to parse dataLink JSON`);
      return [];
    }
    if (!Array.isArray(dataLink)) dataLink = [dataLink];

    const CryptoJS = require('crypto-js');

    function solvePoW(challenge, difficulty) {
      const prefix = '0'.repeat(difficulty);
      let nonce = 0;
      while (true) {
        const hash = CryptoJS.SHA256(challenge + nonce.toString()).toString(CryptoJS.enc.Hex);
        if (hash.startsWith(prefix)) return nonce;
        nonce++;
      }
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

    console.log(`[FlixLatam] Solving PoW (difficulty: ${powDifficulty})...`);
    const nonce = solvePoW(powChallenge, powDifficulty);
    const aesKey = deriveKey(powChallenge, nonce, powSalt);
    console.log(`[FlixLatam] PoW solved (nonce: ${nonce})`);

    const embeds = [];
    for (const item of dataLink) {
      const vLang = (item.video_language || '').toUpperCase();
      if (vLang !== 'LAT') continue;
      if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds)) continue;
      for (const embed of item.sortedEmbeds) {
        if (!embed.link) continue;
        try {
          const decryptedUrl = decryptLink(embed.link, aesKey);
          if (decryptedUrl && decryptedUrl.startsWith('http')) {
            embeds.push({ url: decryptedUrl, servername: embed.servername || 'Server' });
          }
        } catch (e) {
          console.log(
            `[FlixLatam] Decrypt failed for ${embed.servername || 'unknown'}: ${e.message}`
          );
        }
      }
    }

    if (embeds.length === 0) {
      console.log(`[FlixLatam] No LAT embeds found or decrypted`);
      return [];
    }

    console.log(`[FlixLatam] Resolving ${embeds.length} embeds...`);
    const streams = [];
    for (const emb of embeds) {
      try {
        const resolved = await resolveEmbed(emb.url);
        if (resolved && resolved.url) {
          streams.push({
            url: resolved.url,
            quality: resolved.quality || '1080p',
            serverLabel: resolved.serverName || emb.servername,
            language: 'Latino',
            headers: resolved.headers || { 'User-Agent': UA, Referer: BASE_URL + '/' },
          });
        }
      } catch (e) {
        console.log(`[FlixLatam] Resolve failed for ${emb.servername}: ${e.message}`);
      }
    }

    return await finalizeStreams(streams, 'FlixLatam', searchTitle);
  } catch (error) {
    console.error(`[FlixLatam] Error: ${error.message}`);
    return [];
  }
}
