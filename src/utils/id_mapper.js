const { fetchJson } = require('./http.js');

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

const ID_CACHE = new Map();

async function getTmdbInfo(tmdbId, mediaType) {
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
        const data = await fetchJson(url);
        return {
            title: data.title || data.name,
            year: (data.release_date || data.first_air_date || "").split("-")[0]
        };
    } catch (e) {
        return null;
    }
}

async function getCorrectImdbId(tmdbId, mediaType) {
    if (!tmdbId) return { imdbId: null, title: "" };
    const cacheKey = `${mediaType}_${tmdbId}`;
    if (ID_CACHE.has(cacheKey)) return ID_CACHE.get(cacheKey);
    if (tmdbId.startsWith("tt")) {
        const res = { imdbId: tmdbId, title: "Contenido", offset: 0, fromMapping: false };
        ID_CACHE.set(cacheKey, res);
        return res;
    }
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const idUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
        const idRes = await fetchJson(idUrl);
        if (!idRes || !idRes.imdb_id) {
            const result = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
            ID_CACHE.set(cacheKey, result);
            return result;
        }
        const metaRes = await getTmdbInfo(tmdbId, mediaType);
        const result = {
            imdbId: idRes.imdb_id,
            title: metaRes?.title || "Contenido",
            year: metaRes?.year || null,
            offset: 0,
            fromMapping: false
        };
        ID_CACHE.set(cacheKey, result);
        return result;
    } catch (e) {
        const result = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
        ID_CACHE.set(cacheKey, result);
        return result;
    }
}

module.exports = { getCorrectImdbId, getTmdbInfo };