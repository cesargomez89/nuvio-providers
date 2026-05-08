const { fetchJson } = require('./http.js');

const TMDB_API_KEY = [
  '439c478a771f35c05022f9feabcca01c',
  'd131017ccc6e5462a81c9304d21476de',
  '1c29a5198ee1854bd5eb45dbe8d17d92',
][Math.floor(Math.random() * 3)];
const titleCache = new Map();
const idCache = new Map();

async function getTmdbTitle(tmdbId, mediaType, retries = 2) {
  const cacheKey = `${mediaType}_${tmdbId}`;
  if (titleCache.has(cacheKey)) return titleCache.get(cacheKey);
  if (retries < 2) await new Promise((r) => setTimeout(r, 1000));

  const isImdb = tmdbId && tmdbId.startsWith('tt');
  try {
    const type = mediaType === 'movie' || mediaType === 'movies' ? 'movie' : 'tv';
    const fetchUrl = isImdb
      ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
      : `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;

    const data = await fetchJson(fetchUrl);
    const title = isImdb
      ? data[type + '_results']?.[0]?.title || data[type + '_results']?.[0]?.name
      : data.title || data.name;

    const result = title || null;
    titleCache.set(cacheKey, result);
    return result;
  } catch {
    if (retries > 0) return getTmdbTitle(tmdbId, mediaType, retries - 1);
    titleCache.set(cacheKey, null);
    return null;
  }
}

async function getTmdbInfo(tmdbId, mediaType, lang, retries = 2) {
  try {
    const type = mediaType === 'movie' || mediaType === 'movies' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${lang || 'es-MX'}`;
    const data = await fetchJson(url);
    return {
      title: data.title || data.name,
      originalTitle: data.original_title || data.original_name || null,
      year: (data.release_date || data.first_air_date || '').split('-')[0],
      genres: (data.genres || []).map((g) => g.id),
      originCountries:
        data.origin_country || (data.production_countries || []).map((c) => c.iso_3166_1) || [],
    };
  } catch {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return getTmdbInfo(tmdbId, mediaType, lang, retries - 1);
    }
    return null;
  }
}

async function getCorrectImdbId(tmdbId, mediaType) {
  if (!tmdbId) return { imdbId: null, title: '' };
  const cacheKey = `${mediaType}_${tmdbId}`;
  if (idCache.has(cacheKey)) return idCache.get(cacheKey);

  if (tmdbId.startsWith('tt')) {
    const res = { imdbId: tmdbId, title: 'Contenido', offset: 0, fromMapping: false };
    idCache.set(cacheKey, res);
    return res;
  }

  try {
    const type = mediaType === 'movie' || mediaType === 'movies' ? 'movie' : 'tv';
    const idUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
    const idRes = await fetchJson(idUrl);
    if (!idRes || !idRes.imdb_id) {
      const result = { imdbId: null, title: 'Contenido', offset: 0, fromMapping: false };
      idCache.set(cacheKey, result);
      return result;
    }
    const metaRes = await getTmdbInfo(tmdbId, mediaType);
    const result = {
      imdbId: idRes.imdb_id,
      title: metaRes?.title || 'Contenido',
      year: metaRes?.year || null,
      offset: 0,
      fromMapping: false,
    };
    idCache.set(cacheKey, result);
    return result;
  } catch {
    const result = { imdbId: null, title: 'Contenido', offset: 0, fromMapping: false };
    idCache.set(cacheKey, result);
    return result;
  }
}

async function getTmdbAliases(tmdbId, mediaType) {
  try {
    const titleEs = await getTmdbTitle(tmdbId, mediaType);
    const titleEn = await (async () => {
      try {
        const type = mediaType === 'movie' || mediaType === 'movies' ? 'movie' : 'tv';
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
        const data = await fetchJson(url);
        return data.title || data.name || null;
      } catch {
        return null;
      }
    })();

    const aliases = [];
    if (titleEs) aliases.push(titleEs);
    if (titleEn && titleEn !== titleEs) aliases.push(titleEn);

    try {
      const type = mediaType === 'movie' || mediaType === 'movies' ? 'movie' : 'tv';
      const altUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`;
      const altData = await fetchJson(altUrl);
      const titles = altData.titles || altData.results || [];
      for (const t of titles) {
        const altTitle = t.title || t.name;
        if (altTitle && !aliases.includes(altTitle)) aliases.push(altTitle);
      }
    } catch {
      console.warn(`[TMDB-Aliases] Alternative titles fetch failed`);
    }

    return aliases;
  } catch {
    return [];
  }
}

module.exports = { getTmdbTitle, getTmdbInfo, getCorrectImdbId, getTmdbAliases, TMDB_API_KEY };
