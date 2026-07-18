import { fetchJson } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo, getTmdbAliases } from '../utils/tmdb.js';

const API_URL = 'https://lamovie.org/wp-api/v1';
function normalizeQuality(quality) {
  const str = quality.toString().toLowerCase();
  const match = str.match(/(\d+)/);
  if (match) return match[1] + 'p';
  if (str.indexOf('4k') !== -1 || str.indexOf('uhd') !== -1) return '2160p';
  if (str.indexOf('full') !== -1 || str.indexOf('fhd') !== -1) return '1080p';
  if (str.indexOf('hd') !== -1) return '720p';
  return 'SD';
}

function getServerName(url) {
  if (url.indexOf('goodstream') !== -1) return 'GoodStream';
  if (
    url.indexOf('hlswish') !== -1 ||
    url.indexOf('streamwish') !== -1 ||
    url.indexOf('strwish') !== -1 ||
    url.indexOf('vibuxer') !== -1
  )
    return 'StreamWish';
  if (url.indexOf('voe.sx') !== -1) return 'VOE';
  if (url.indexOf('filemoon') !== -1) return 'Filemoon';
  if (url.indexOf('vimeos.net') !== -1) return 'Vimeos';
  if (url.indexOf('dood') !== -1 || url.indexOf('d0000d') !== -1) return 'DoodStream';
  return 'Online';
}

function normalizeTitle(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getTmdbData(tmdbId, mediaType) {
  const attempts = [
    { lang: 'es-MX', name: 'Latino' },
    { lang: 'en-US', name: 'Inglés' },
  ];

  async function tryLang(lang, name) {
    const info = await getTmdbInfo(tmdbId, mediaType, lang);
    if (!info) throw new Error('No info');
    const title = info.title;
    if (lang === 'es-MX' && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(title)) {
      throw new Error('CJK in Spanish');
    }
    console.log(
      `[LaMovie] TMDB (${name}): "${title}"${info.originalTitle && info.originalTitle !== title ? ` | Original: "${info.originalTitle}"` : ''}`
    );
    return {
      title,
      originalTitle: info.originalTitle,
      year: info.year,
      genres: info.genres,
      originCountries: info.originCountries,
    };
  }

  try {
    return await tryLang(attempts[0].lang, attempts[0].name);
  } catch (e) {
    console.log(`[LaMovie] Error TMDB Latino: ${e.message}`);
    return await tryLang(attempts[1].lang, attempts[1].name);
  }
}

async function searchById(tmdbInfo, extraAliases) {
  const { title, originalTitle, year } = tmdbInfo;
  const searchTerms = [title, originalTitle, ...(extraAliases || [])]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  for (const term of searchTerms) {
    const url = API_URL + '/search?postType=any&q=' + encodeURIComponent(term) + '&postsPerPage=10';
    try {
      const data = await fetchJson(url);
      if (!data || !data.data || !data.data.posts) continue;

      const normTerm = normalizeTitle(term);
      const termWords = normTerm.split(/\s+/).filter((w) => w.length > 3);
      let bestMatch = null;

      for (const post of data.data.posts) {
        const normTitle = normalizeTitle(post.title);
        const normOrig = normalizeTitle(post.original_title || '');

        if (normTitle === normTerm || normOrig === normTerm) {
          bestMatch = post;
          break;
        }

        if (!bestMatch && year) {
          const yearMatch = post.title.match(/\((\d{4})\)/);
          if (yearMatch && yearMatch[1] === String(year)) {
            bestMatch = post;
          }
        }
      }

      if (!bestMatch) {
        for (const post of data.data.posts) {
          const normTitle = normalizeTitle(post.title);
          const resultWords = normTitle.split(/\s+/);
          if (termWords.some((w) => resultWords.includes(w))) {
            bestMatch = post;
            console.log(`[LaMovie] Word-match: "${post.title}" → id:${post._id}`);
            break;
          }
        }
      }

      if (!bestMatch && data.data.posts.length > 0) {
        bestMatch = data.data.posts[0];
      }

      if (bestMatch) {
        console.log(
          `[LaMovie] ✓ Encontrado por búsqueda: "${bestMatch.title}" → id:${bestMatch._id}`
        );
        return { id: bestMatch._id };
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function getEpisodeId(seriesId, seasonNum, episodeNum) {
  const url =
    API_URL +
    '/single/episodes/list?_id=' +
    seriesId +
    '&season=' +
    seasonNum +
    '&page=1&postsPerPage=50';
  try {
    const data = await fetchJson(url);
    if (!data || !data.data || !data.data.posts) return null;
    const posts = data.data.posts;
    for (const e of posts) {
      if (
        String(e.season_number) === String(seasonNum) &&
        String(e.episode_number) === String(episodeNum)
      ) {
        console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} id:${e._id}`);
        return String(e._id);
      }
    }
    console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} no encontrado`);
    return null;
  } catch (err) {
    console.log(`[LaMovie] Error episodios: ${err.message}`);
    return null;
  }
}

async function processEmbed(embed, signal) {
  if (!embed.url || embed.url.includes('voe.sx')) return null;
  const resolved = await resolveEmbed(embed.url, signal);
  if (!resolved || !resolved.url) {
    console.log('[LaMovie] Sin resolver para: ' + embed.url);
    return null;
  }
  const quality = normalizeQuality(embed.quality || '1080p');
  const serverName = getServerName(embed.url);
  return {
    name: 'LaMovie',
    title: quality + ' · ' + serverName,
    url: resolved.url,
    quality,
    headers: resolved.headers || {},
    serverLabel: serverName,
    langLabel: 'Latino',
  };
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || !mediaType) return [];
  const startTime = Date.now();
  const resolvedType = mediaType === 'series' ? 'tv' : mediaType || 'movie';

  console.log(
    `[LaMovie] Buscando: TMDB ${tmdbId} (${resolvedType})${season ? ` S${season}E${episode}` : ''}`
  );

  const OVERALL_TIMEOUT = 25000;
  const hasAbort = typeof AbortController !== 'undefined';
  const controller = hasAbort ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), OVERALL_TIMEOUT) : null;

  try {
    const [tmdbInfo, aliases] = await Promise.all([
      getTmdbData(tmdbId, resolvedType),
      getTmdbAliases(tmdbId, resolvedType),
    ]);
    if (!tmdbInfo) return [];

    const found = await searchById(tmdbInfo, aliases);
    if (!found) {
      console.log('[LaMovie] No encontrado por búsqueda');
      return [];
    }

    let targetId = found.id;

    if (resolvedType === 'tv' && season && episode) {
      const epId = await getEpisodeId(targetId, season, episode);
      if (!epId) {
        console.log(`[LaMovie] Episodio S${season}E${episode} no encontrado`);
        return [];
      }
      targetId = epId;
    }

    if (!targetId) return [];

    const data = await fetchJson(API_URL + '/player?postId=' + targetId + '&demo=0');
    if (!data || !data.data || !data.data.embeds) {
      console.log('[LaMovie] No hay embeds disponibles');
      return [];
    }

    const embeds = data.data.embeds;
    const results = await Promise.allSettled(embeds.map((e) => processEmbed(e, controller ? controller.signal : undefined)));
    const streams = results
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((r) => r);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[LaMovie] ✓ ${streams.length} streams en ${elapsed}s`);

    return await finalizeStreams(streams, 'LaMovie', tmdbInfo.title);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`[LaMovie] Timeout tras ${OVERALL_TIMEOUT}ms`);
    } else {
      console.log(`[LaMovie] Error: ${err.message}`);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
