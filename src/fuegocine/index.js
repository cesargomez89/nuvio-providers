/**
 * fuegocine Provider
 */
import { extractStreams } from './extractor.js';
async function getStreams(tmdbId, mediaType, season, episode, title) {
    try {
        console.log(`[FuegoCine] Request: ${mediaType} ${tmdbId}`);
        return await extractStreams(tmdbId, mediaType, season, episode, title);
    } catch (error) {
        console.error(`[FuegoCine] Error: ${error.message}`);
        return [];
    }
}
module.exports = { getStreams };