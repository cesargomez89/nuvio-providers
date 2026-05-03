import { fetchJson, fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    const rawId = tmdbId.toString().includes(":") ? tmdbId.toString().split(":").find(x => !isNaN(x) && x.length > 0) : tmdbId;
    const isMovie = mediaType === "movie" || mediaType === "movies";
    // TODO: Implement seriesmetro specific API call
    // This is a placeholder - need to find the actual API endpoint
    console.log(`[SeriesMetro] Looking for content: ${rawId}`);
    return [];
}