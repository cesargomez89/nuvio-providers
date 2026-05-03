import { fetchJson, fetchHtml } from '../utils/http.js';
export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[CineCity] Looking for content: ${tmdbId}`);
    return [];
}