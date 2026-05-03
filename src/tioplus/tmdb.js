const axios = require("axios");

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const titleCache = new Map();

export async function getTmdbTitle(tmdbId, mediaType, language = "en-US", retries = 2) {
    if (!tmdbId) return null;
    const cleanId = tmdbId.toString().split(":")[0];
    const cacheKey = `${cleanId}_${mediaType}_${language}`;
    if (titleCache.has(cacheKey)) return titleCache.get(cacheKey);
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        let url;
        if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=${language}`;
            const { data } = await axios.get(url, { timeout: 6000 });
            const result = type === "movie" ? data.movie_results?.[0] : data.tv_results?.[0] || data.movie_results?.[0];
            const title = result?.name || result?.title || null;
            if (title) titleCache.set(cacheKey, title);
            return title;
        } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}&language=${language}`;
            const { data } = await axios.get(url, { timeout: 6000 });
            const title = data.name || data.title || null;
            if (title) titleCache.set(cacheKey, title);
            return title;
        }
    } catch (e) {
        if (retries > 0) {
            console.log(`[TMDB-Rescue] Retrying ${tmdbId} (${retries} left)...`);
            await new Promise(r => setTimeout(r, 1000));
            return getTmdbTitle(tmdbId, mediaType, retries - 1);
        }
        console.log(`[TMDB-Rescue] Failed to fetch title for ${tmdbId}: ${e.message}`);
        return null;
    }
}

export async function getTmdbInfo(tmdbId, mediaType) {
    if (!tmdbId) return null;
    const cleanId = tmdbId.toString().split(":")[0];
    const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
    try {
        let url, result;
        if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const { data } = await axios.get(url, { timeout: 6000 });
            result = type === "movie" ? data.movie_results?.[0] : data.tv_results?.[0] || data.movie_results?.[0];
        } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}`;
            const { data } = await axios.get(url, { timeout: 6000 });
            result = data;
        }
        if (result) {
            const title = result.name || result.title;
            const date = result.release_date || result.first_air_date || "";
            const year = date.split("-")[0];
            return { title, year };
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function getTmdbAliases(tmdbId, mediaType) {
    if (!tmdbId) return [];
    const cleanId = tmdbId.toString().split(":")[0];
    const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
    const titles = new Set();
    try {
        const [enTitle, esTitle] = await Promise.all([
            getTmdbTitle(cleanId, type, "en-US"),
            getTmdbTitle(cleanId, type, "es-MX")
        ]);
        if (enTitle) titles.add(enTitle);
        if (esTitle) titles.add(esTitle);
        const altUrl = `https://api.themoviedb.org/3/${type}/${cleanId}/alternative_titles?api_key=${TMDB_API_KEY}`;
        const { data } = await axios.get(altUrl, { timeout: 5000 });
        const altResults = data.titles || data.results || [];
        altResults.forEach(item => {
            if (item.title) titles.add(item.title);
        });
        return Array.from(titles);
    } catch (e) {
        console.warn(`[TMDB-Aliases] Failed for ${tmdbId}: ${e.message}`);
        return Array.from(titles);
    }
}