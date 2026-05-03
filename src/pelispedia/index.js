/**
 * pelispedia Provider
 */
import { extractStreams } from './extractor.js';
async function getStreams(tmdbId, mediaType, season, episode, title) {
    try { return await extractStreams(tmdbId, mediaType, season, episode, title); }
    catch (e) { console.error(`[PelisPedia] Error: ${e.message}`); return []; }
}
module.exports = { getStreams };