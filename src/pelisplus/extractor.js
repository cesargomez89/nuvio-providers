import { fetchJson, fetchHtml, BASE_URL, LOGO } from './http.js';
export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[PelisPlus] Looking for content: ${tmdbId}`);
    return [];
}