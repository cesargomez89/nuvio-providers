/**
 * cinecalidad Provider
 * Main entry point.
 */
import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType, season, episode, title) {
    try {
        console.log(`[CineCalidad] Request: ${mediaType} ${tmdbId}`);
        const streams = await extractStreams(tmdbId, mediaType, season, episode, title);
        return streams;
    } catch (error) {
        console.error(`[CineCalidad] Error: ${error.message}`);
        return [];
    }
}
module.exports = { getStreams };