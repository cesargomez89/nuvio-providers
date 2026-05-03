import { fetchJson, getSessionUA } from '../utils/http.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { validateStream } from '../utils/m3u8.js';

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

async function getFallbackTitle(tmdbId, mediaType) {
    try {
        const type = mediaType === "movie" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
        const data = await fetchJson(url);
        return data.name || data.title || null;
    } catch (e) {
        return null;
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, providedTitle) {
    console.log(`[PelisPanda] Sync-Extracción para TMDB: ${tmdbId} (${mediaType})`);
    try {
        let searchTitle = providedTitle;
        if (!searchTitle || searchTitle === tmdbId) {
            searchTitle = await getFallbackTitle(tmdbId, mediaType);
        }
        if (!searchTitle) {
            console.log("[PelisPanda] Falló obtención de título.");
            return [];
        }
        const cleanTitle = searchTitle.split(" ").slice(0, 3).join(" ");
        console.log(`[PelisPanda] Consultando API: ${cleanTitle}`);
        const searchUrl = `https://pelispanda.org/wp-json/wpreact/v1/search?query=${encodeURIComponent(cleanTitle)}`;
        const searchData = await fetchJson(searchUrl, {
            headers: { "Referer": "https://pelispanda.org/" }
        });
        if (!searchData || !searchData.results)
            return [];
        const targetType = mediaType === "movie" ? "pelicula" : "serie";
        let movieMatch = searchData.results.find((r) => r.tmdb_id == tmdbId && r.type === targetType);
        if (!movieMatch)
            movieMatch = searchData.results.find((r) => r.type === targetType);
        if (!movieMatch || !movieMatch.slug)
            return [];
        console.log(`[PelisPanda] Seleccionado: ${movieMatch.title} (Slug: ${movieMatch.slug})`);
        const endpointType = mediaType === "movie" ? "movie" : "serie";
        const playersUrl = `https://pelispanda.org/wp-json/wpreact/v1/${endpointType}/${movieMatch.slug}/related`;
        const playersData = await fetchJson(playersUrl, {
            headers: { "Referer": "https://pelispanda.org/" }
        });
        let embeds = [];
        if (mediaType === "movie") {
            if (playersData && playersData.embeds)
                embeds = playersData.embeds;
        } else {
            if (playersData && playersData.embeds) {
                embeds = playersData.embeds.filter((e) => e.season == season && e.episode == episode);
            }
        }
        if (!embeds || embeds.length === 0)
            return [];
        const streamPromises = embeds.map(async (player) => {
            const lang = (player.lang || "Latino").toLowerCase();
            if (lang.includes("sub") || lang.includes("vose") || lang.includes("espana"))
                return null;
            const rawUrl = player.url;
            if (!rawUrl)
                return null;
            try {
                const resolvedData = await resolveEmbed(rawUrl);
                if (!resolvedData || !resolvedData.url)
                    return null;
                const streamData = {
                    url: resolvedData.url,
                    quality: resolvedData.quality || "HD",
                    verified: resolvedData.verified || false,
                    langLabel: "Latino",
                    serverLabel: resolvedData.serverName || "Online",
                    headers: resolvedData.headers || {
                        "User-Agent": getSessionUA(),
                        "Referer": rawUrl
                    }
                };
                return await Promise.race([
                    validateStream(streamData).catch(() => streamData),
                    new Promise((resolve) => setTimeout(() => resolve(streamData), 4500))
                ]);
            } catch (e) {
                return null;
            }
        });
        const results = await Promise.all(streamPromises);
        return results.filter(Boolean);
    } catch (error) {
        console.error(`[PelisPanda] Error: ${error.message}`);
        return [];
    }
}