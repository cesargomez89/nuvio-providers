import { fetchJson, fetchHtml } from '../utils/http.js';
import { getTmdbTitle, getTmdbInfo, getTmdbAliases } from './tmdb.js';
export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[PelisPanda] Looking for content: ${tmdbId}`);
    return [];
}