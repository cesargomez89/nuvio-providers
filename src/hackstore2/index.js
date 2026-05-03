/**
 * hackstore2 Provider
 */
import { extractStreams } from './extractor.js';
async function getStreams(tmdbId, mediaType, season, episode, title) {
    try {
        console.log(`[HackStore2] Request: ${mediaType} ${tmdbId}`);
        return await extractStreams(tmdbId, mediaType, season, episode, title);
    } catch (error) {
        console.error(`[HackStore2] Error: ${error.message}`);
        return [];
    }
}
module.exports = { getStreams };