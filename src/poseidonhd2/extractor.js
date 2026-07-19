import { fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { buildSlug } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE_URL = 'https://www.poseidonhd2.co';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-MX,es;q=0.9',
  Referer: `${BASE_URL}/`,
};

const LANGUAGE_MAP = {
  latino: 'Latino',
  spanish: 'Español',
  english: 'Subtitulado',
};

function extractNextData(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.warn(`[PoseidonHD2] Error parsing JSON: ${e.message}`);
    return null;
  }
}

function extractEmbedUrl(playerHtml) {
  const match = playerHtml.match(/(?:var|let)\s+url\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

async function fetchPlayerEmbed(playerUrl, signal) {
  try {
    const html = await fetchHtml(playerUrl, { headers: HEADERS, signal });
    return extractEmbedUrl(html);
  } catch (e) {
    console.warn(`[PoseidonHD2] Error en player: ${e.message}`);
    return null;
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || !mediaType) return [];
  const isMovieType = isMovie(mediaType);
  console.log(`[PoseidonHD2] Buscando: TMDB ${tmdbId} (${mediaType})`);

  try {
    const realId = cleanTmdbId(tmdbId);
    const info = await getTmdbInfo(realId, mediaType, 'es-MX');
    const title = info?.title;
    if (!title) return [];

    const slug = buildSlug(title);
    if (!slug) return [];

    let pageUrl;
    if (isMovieType) {
      pageUrl = `${BASE_URL}/pelicula/${realId}/${slug}`;
    } else {
      const s = season || '1';
      const ep = episode || '1';
      pageUrl = `${BASE_URL}/serie/${realId}/${slug}/temporada/${s}/episodio/${ep}`;
    }

    console.log(`[PoseidonHD2] Obteniendo página: ${pageUrl}`);
    const html = await fetchHtml(pageUrl, { headers: HEADERS });
    if (!html || html.includes('Page not found')) return [];

    const nextData = extractNextData(html);
    if (!nextData) return [];

    const pp = nextData.props?.pageProps;
    if (!pp) return [];

    const dataSource = isMovieType ? pp.thisMovie : pp.episode;
    if (!dataSource || !dataSource.videos) return [];

    const videoEntries = [];
    for (const lang of ['latino', 'spanish', 'english']) {
      const langVideos = dataSource.videos[lang];
      if (!Array.isArray(langVideos)) continue;
      for (const v of langVideos) {
        if (v && v.result) {
          videoEntries.push({
            playerUrl: v.result,
            quality: v.quality || 'HD',
            serverLabel: v.cyberlocker || '',
            language: LANGUAGE_MAP[lang] || 'Latino',
          });
        }
      }
    }

    if (videoEntries.length === 0) return [];

    const hasAbort = typeof AbortController !== 'undefined';
    const ac = hasAbort ? new AbortController() : null;
    const signal = hasAbort ? ac.signal : null;
    let globalTimeoutId;
    if (hasAbort) globalTimeoutId = setTimeout(() => ac.abort(), 30000);

    const rawStreams = [];
    const resolved = await parallelWithLimit(
      videoEntries,
      async (entry) => {
        try {
          if (signal?.aborted) return null;
          const embedUrl = await fetchPlayerEmbed(entry.playerUrl, signal);
          if (!embedUrl) return null;

          const result = await resolveEmbed(embedUrl, signal);
          if (result && result.url) {
            return {
              langLabel: entry.language,
              url: result.url,
              quality: result.quality || entry.quality || 'HD',
              headers: result.headers || {},
              serverLabel: entry.serverLabel,
            };
          }
        } catch (e) {
          console.warn(`[PoseidonHD2] Error procesando ${entry.serverLabel}: ${e.message}`);
        }
        return null;
      },
      5
    );

    clearTimeout(globalTimeoutId);
    rawStreams.push(...resolved.filter(Boolean));

    return await finalizeStreams(rawStreams, 'PoseidonHD2');
  } catch (e) {
    console.error(`[PoseidonHD2] Error: ${e.message}`);
    return [];
  }
}
