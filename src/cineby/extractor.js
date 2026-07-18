import { fetchJson, fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbTitle } from '../utils/tmdb.js';
import { cleanTmdbId } from '../utils/helpers.js';
import { decryptSources } from './streamcrypto.js';

const API_BASE = 'https://api.wingsdatabase.com';
const VIDKING_BASE = 'https://www.vidking.net';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: VIDKING_BASE,
  Referer: VIDKING_BASE + '/',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryApiPath(tmdbId, mediaType, season, episode) {
  const numericId = parseInt(cleanTmdbId(tmdbId));
  const isMovie = mediaType === 'movie';
  const s = season !== undefined && season !== null ? parseInt(season) : 0;
  const e = episode !== undefined && episode !== null ? parseInt(episode) : 0;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const seedUrl = `${API_BASE}/seed?mediaId=${numericId}`;
      const seedData = await fetchJson(seedUrl, { headers: HEADERS });
      const seed = seedData.seed;
      if (!seed) {
        console.log(`[Cineby] No seed in response`);
        continue;
      }

      const mediaTypeParam = isMovie ? 'movie' : 'tv';
      const sourcesUrl = `${API_BASE}/cdn/sources-with-title?tmdbId=${numericId}&mediaType=${mediaTypeParam}&seasonId=${s}&episodeId=${e}&enc=2&seed=${seed}`;
      const encryptedData = await fetchJson(sourcesUrl, { headers: HEADERS });

      if (typeof encryptedData === 'string' && encryptedData.length > 0) {
        const decrypted = decryptSources(encryptedData, seed, numericId);
        if (decrypted && decrypted.sources && decrypted.sources.length > 0) {
          return decrypted.sources.map((src) => ({
            url: src.url,
            quality: src.quality || '1080p',
            headers: { Referer: VIDKING_BASE + '/', 'User-Agent': UA },
          }));
        }
      }
    } catch (e) {
      console.log(`[Cineby] API attempt ${attempt + 1} failed: ${e.message}`);
      if (attempt < 2) await sleep(1000);
    }
  }
  return null;
}

async function tryEmbedFallback(tmdbId, mediaType, season, episode) {
  try {
    const numericId = parseInt(cleanTmdbId(tmdbId));
    let embedUrl;
    if (mediaType === 'movie' || (!season && !episode)) {
      embedUrl = `${VIDKING_BASE}/embed/movie/${numericId}`;
    } else {
      const s = parseInt(season) || 1;
      const e = parseInt(episode) || 1;
      embedUrl = `${VIDKING_BASE}/embed/tv/${numericId}/${s}/${e}`;
    }

    const html = await fetchHtml(embedUrl, { headers: HEADERS });
    const m3u8Regex = /https?:\/\/[^"'\s]*\.m3u8[^"'\s]*/gi;
    const matches = html.match(m3u8Regex);
    if (matches && matches.length > 0) {
      return matches.map((url) => ({
        url,
        quality: '1080p',
        headers: { Referer: VIDKING_BASE + '/', 'User-Agent': UA },
      }));
    }
  } catch (e) {
    console.log(`[Cineby] Embed fallback failed: ${e.message}`);
  }
  return null;
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId) return [];
  console.log(`[Cineby] Looking for content: ${tmdbId} (${mediaType})`);

  try {
    const title = await getTmdbTitle(cleanTmdbId(tmdbId), mediaType);
    if (!title) {
      console.log(`[Cineby] No title found for ${tmdbId}`);
      return [];
    }

    console.log(`[Cineby] Trying API path...`);
    let sources = await tryApiPath(tmdbId, mediaType, season, episode);

    if (!sources) {
      console.log(`[Cineby] API failed, trying embed fallback...`);
      sources = await tryEmbedFallback(tmdbId, mediaType, season, episode);
    }

    if (!sources || sources.length === 0) {
      console.log(`[Cineby] No sources found`);
      return [];
    }

    const rawStreams = sources.map((s) => ({
      url: s.url,
      quality: s.quality,
      serverLabel: 'VidKing',
      language: 'Latino',
      headers: s.headers || { 'User-Agent': UA, Referer: VIDKING_BASE + '/' },
    }));

    return await finalizeStreams(rawStreams, 'Cineby', title);
  } catch (error) {
    console.error(`[Cineby] Error: ${error.message}`);
    return [];
  }
}
