/**
 * brazucaplay Provider
 */
import { extractStreams } from './extractor.js';
async function getStreams(tmdbId, mediaType, season, episode, title) {
    try {
        console.log(`[BrazucaPlay] Request: ${mediaType} ${tmdbId}`);
        return await extractStreams(tmdbId, mediaType, season, episode, title);
    } catch (error) {
        console.error(`[BrazucaPlay] Error: ${error.message}`);
        return [];
    }
}
module.exports = { getStreams };