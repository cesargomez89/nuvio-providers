import { fetchJson, fetchHtml } from '../utils/http.js';
export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[SoloLatino] Looking for content: ${tmdbId}`);
    return [];
}