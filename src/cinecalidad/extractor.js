import { fetchJson, fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbTitle, getTmdbAliases } from './tmdb.js';

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    // TODO: Implement cinecalidad specific API call
    console.log(`[CineCalidad] Looking for content: ${tmdbId}`);
    return [];
}