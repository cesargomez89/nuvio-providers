/**
 * brazucaplay Provider
 */
import { extractStreams } from './extractor.js';
async function getStreams(tmdbId, mediaType, season, episode) {
    try { return await extractStreams(tmdbId, mediaType, season, episode); }
    catch (e) { console.error(`[BrazucaPlay] Error: ${e.message}`); return []; }
}
module.exports = { getStreams };
