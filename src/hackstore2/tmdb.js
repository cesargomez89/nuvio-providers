const axios = require("axios");
const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

export async function getTmdbTitle(tmdbId, mediaType, language = "en-US", retries = 2) {
    if (!tmdbId) return null;
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`;
        const { data } = await axios.get(url, { timeout: 6000 });
        return data.name || data.title || null;
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return getTmdbTitle(tmdbId, mediaType, retries - 1);
        }
        return null;
    }
}

export async function getTmdbInfo(tmdbId, mediaType) {
    if (!tmdbId) return null;
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`;
        const { data } = await axios.get(url, { timeout: 6000 });
        const title = data.name || data.title;
        const date = data.release_date || data.first_air_date || "";
        const year = date.split("-")[0];
        return { title, year };
    } catch (e) { return null; }
}

export async function getTmdbAliases(tmdbId, mediaType) {
    if (!tmdbId) return [];
    const titles = new Set();
    try {
        const [enTitle, esTitle] = await Promise.all([
            getTmdbTitle(tmdbId, mediaType, "en-US"),
            getTmdbTitle(tmdbId, mediaType, "es-MX")
        ]);
        if (enTitle) titles.add(enTitle);
        if (esTitle) titles.add(esTitle);
        return Array.from(titles);
    } catch (e) { return Array.from(titles); }
}