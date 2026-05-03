import { fetchJson, fetchHtml } from './http.js';
export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[FuegoCine] Looking for content: ${tmdbId}`);
    return [];
}