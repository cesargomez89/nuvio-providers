import { fetchJson, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { parallelWithLimit } from '../utils/parallel.js';
import { isMovie } from '../utils/helpers.js';

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId) return [];
  const rawId =
    typeof tmdbId === 'string' && tmdbId.includes(':')
      ? tmdbId.split(':').find((x) => !isNaN(x) && x.length > 0) || tmdbId
      : tmdbId;
  let apiUrl = `https://cuevana.unbuendato.com/?id=${rawId}`;
  if (!isMovie(mediaType) && season && episode) {
    apiUrl += `&season=${season}&episode=${episode}`;
  }
  try {
    const data = await fetchJson(apiUrl, {
      headers: {
        'User-Agent': getSessionUA(),
      },
    });
    if (!data.success || !data.languages) {
      console.log('[CuevanaUBD] Sin resultados o API falló');
      return [];
    }
    const entries = [];
    for (const [langKey, servers] of Object.entries(data.languages)) {
      const lKey = langKey.toLowerCase();
      if (!lKey.includes('latino') && !lKey.includes('subtitulado') && !lKey.includes('sub'))
        continue;
      const langLabel = langKey.charAt(0).toUpperCase() + langKey.slice(1);
      for (const [serverKey, url] of Object.entries(servers)) {
        const sKey = serverKey.toLowerCase();
        if (
          sKey.includes('netu') ||
          sKey.includes('hqq') ||
          sKey.includes('waaw') ||
          url.includes('netu') ||
          url.includes('hqq') ||
          url.includes('waaw')
        )
          continue;
        entries.push({ url, serverKey, langLabel });
      }
    }
    const hasAbort = typeof AbortController !== 'undefined';
    const ac = hasAbort ? new AbortController() : null;
    const signal = hasAbort ? ac.signal : null;
    let globalTimeoutId;
    if (hasAbort) globalTimeoutId = setTimeout(() => ac.abort(), 30000);

    const results = await parallelWithLimit(entries, async (entry) => {
      try {
        if (signal?.aborted) return null;
        const res = await resolveEmbed(entry.url, signal);
        if (res) {
          return {
            ...res,
            serverName:
              res.serverName || entry.serverKey.charAt(0).toUpperCase() + entry.serverKey.slice(1),
            lang: entry.langLabel,
          };
        }
      } catch {}
      return null;
    }, 5);

    clearTimeout(globalTimeoutId);
    const rawStreams = results.filter(Boolean);
    return await finalizeStreams(rawStreams, 'Cuevana UBD', data.title || title);
  } catch (e) {
    console.error(`[CuevanaUBD] Error Crítico: ${e.message}`);
    return [];
  }
}
