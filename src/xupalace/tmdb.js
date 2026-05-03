const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const titleCache = new Map();

export async function getTmdbTitle(tmdbId, mediaType, language = "es-MX", retries = 2) {
    if (!tmdbId) return null;
    const cleanId = tmdbId.toString().split(":")[0];
    const cacheKey = `${cleanId}_${mediaType}_${language}`;
    if (titleCache.has(cacheKey)) return titleCache.get(cacheKey);
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        let url;
        if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=${language}`;
            const res = await fetch(url);
            const data = await res.json();
            const result = type === "movie" ? data.movie_results?.[0] : data.tv_results?.[0] || data.movie_results?.[0];
            const title = result?.name || result?.title || null;
            if (title) titleCache.set(cacheKey, title);
            return title;
        } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}&language=${language}`;
            const res = await fetch(url);
            const data = await res.json();
            const title = data.name || data.title || null;
            if (title) titleCache.set(cacheKey, title);
            return title;
        }
    } catch (e) {
        if (retries > 0) {
            console.log(`[TMDB-Rescue] Retrying ${tmdbId} (${retries} left)...`);
            await new Promise(r => setTimeout(r, 1000));
            return getTmdbTitle(tmdbId, mediaType, language, retries - 1);
        }
        return null;
    }
}

export async function getTmdbInfo(tmdbId, mediaType) {
    if (!tmdbId) return null;
    const cleanId = tmdbId.toString().split(":")[0];
    const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
    try {
        let url;
        if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const res = await fetch(url);
            const data = await res.json();
            const result = type === "movie" ? data.movie_results?.[0] : data.tv_results?.[0] || data.movie_results?.[0];
            if (result) {
                const title = result.name || result.title;
                const date = result.release_date || result.first_air_date || "";
                const year = date.split("-")[0];
                return { title, year };
            }
        } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data) {
                const title = data.name || data.title;
                const date = data.release_date || data.first_air_date || "";
                const year = date.split("-")[0];
                return { title, year };
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function getTmdbAliases(tmdbId, mediaType) {
    return [];
}