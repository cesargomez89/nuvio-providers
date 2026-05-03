/**
 * cuevana_unbuendato Provider
 * Main entry point.
 */

import { extractStreams } from './extractor.js';

/**
 * Main function called by Nuvio
 * @param {string} tmdbId - TMDB ID of the media
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} season - Season number (for TV)
 * @param {number} episode - Episode number (for TV)
 */
async function getStreams(tmdbId, mediaType, season, episode, title, year) {
    try {
        console.log(`[CuevanaUBD] Request: ${mediaType} ${tmdbId}`);

        const streams = await extractStreams(tmdbId, mediaType, season, episode, title, year);

        return streams;
    } catch (error) {
        console.error(`[CuevanaUBD] Error: ${error.message}`);
        return [];
    }
}

module.exports = { getStreams };