import { fetchText, fetchJson, BASE_URL } from './http.js';
import { isMovie } from '../utils/helpers.js';
import { getTmdbTitle, getTmdbAliases } from '../utils/tmdb.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { validateStream } from '../utils/m3u8.js';
import { normalizeTitle, titleMatch } from '../utils/title.js';

const cheerio = require('cheerio');

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    
    try {
        console.log(`[PelisPlus] Extracting: ${title || tmdbId} (TMDB: ${tmdbId})`);
        
        let titlesToTry = [title];
        
        if (tmdbId && tmdbId.toString().match(/^\d+/) && !tmdbId.toString().startsWith('tt')) {
            const [aliases, spanishTitle] = await Promise.all([
                getTmdbAliases(tmdbId, mediaType),
                getTmdbTitle(tmdbId, mediaType, 'es-MX')
            ]);
            
            const allAliases = [title];
            if (spanishTitle) allAliases.push(spanishTitle);
            if (aliases) aliases.forEach(a => allAliases.push(a));
            
            const mainKeyword = title ? title.split(/\s+/).filter(w => w.length > 4)[0] : null;
            if (mainKeyword && !allAliases.includes(mainKeyword)) {
                allAliases.push(mainKeyword);
            }
            
            titlesToTry = Array.from(new Set(allAliases.filter(Boolean)));
            console.log(`[PelisPlus] Trying ${titlesToTry.length} search terms`);
        }

        const searchPromises = titlesToTry.slice(0, 3).map(async (t) => {
            try {
                const searchUrl = `${BASE_URL}/search?s=${encodeURIComponent(t)}`;
                const html = await fetchText(searchUrl);
                const matches = [];
                
                const aRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                let m;
                while ((m = aRegex.exec(html)) !== null) {
                    const href = m[1];
                    const content = m[2];
                    
                    if (isMovie(mediaType) && !href.includes('/pelicula/')) continue;
                    if (!isMovie(mediaType) && !href.includes('/serie/')) continue;
                    
                    let resultTitle = '';
                    const pMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                    if (pMatch) {
                        resultTitle = pMatch[1].replace(/<[^>]+>/g, '').trim();
                    } else {
                        const dtMatch = m[0].match(/data-title="([^"]+)"/i);
                        resultTitle = dtMatch ? dtMatch[1].trim() : content.replace(/<[^>]+>/g, '').trim();
                    }
                    
                    resultTitle = resultTitle
                        .replace(/^VER\s+/i, '')
                        .replace(/\s+Online\s+Gratis\s+HD$/i, '')
                        .replace(/\s+Online\s+Latino\s+HD$/i, '')
                        .replace(/\(\d{4}\)$/, '')
                        .trim();
                    
                    const tWords = t.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                    const rWords = resultTitle.toLowerCase().split(/\s+/);
                    const isWordMatch = tWords.some(w => rWords.includes(w));
                    const isUrlMatch = href.toLowerCase().includes(t.toLowerCase().replace(/\s+/g, '-')) ||
                        (tWords.length > 0 && tWords.every(w => href.toLowerCase().includes(w)));
                    
                    if (titleMatch(t, resultTitle) || titleMatch(title, resultTitle) || isWordMatch || isUrlMatch) {
                        console.log(`[PelisPlus] Match found: ${resultTitle}`);
                        matches.push({
                            href: BASE_URL + (href.startsWith('/') ? href : '/' + href),
                            title: resultTitle
                        });
                    }
                }
                return matches;
            } catch {
                return [];
            }
        });

        const allSearchHits = await Promise.all(searchPromises);
        
        let movieUrl = null;
        let bestMatch = null;
        
        let exactMatches = [];
        let partialMatches = [];
        for (const hits of allSearchHits) {
            for (const hit of hits) {
                const hitNorm = normalizeTitle(hit.title);
                const isExact = title && hitNorm === normalizeTitle(title);
                if (isExact) {
                    exactMatches.push(hit);
                } else {
                    partialMatches.push(hit);
                }
            }
        }
        if (exactMatches.length > 0) {
            bestMatch = exactMatches[0];
            console.log(`[PelisPlus] Selected (exact): ${bestMatch.title}`);
        } else if (partialMatches.length > 0) {
            partialMatches.sort((a, b) => a.title.length - b.title.length);
            bestMatch = partialMatches[0];
            console.log(`[PelisPlus] Selected (best): ${bestMatch.title}`);
        }
        
        if (bestMatch) {
            movieUrl = bestMatch.href;
        }
        
        if (!movieUrl) {
            console.log(`[PelisPlus] No matches found for ${tmdbId}`);
            return [];
        }

        if (!isMovie(mediaType)) {
            if (movieUrl.endsWith('/')) movieUrl = movieUrl.slice(0, -1);
            movieUrl = `${movieUrl}/temporada/${season}/capitulo/${episode}`;
            console.log(`[PelisPlus] Episode URL: ${movieUrl}`);
        }

        const pageHtml = await fetchText(movieUrl);
        const rawResults = [];
        const seenUrls = new Set();
        
        const $ = cheerio.load(pageHtml);
        
        $('li[data-url], li.playurl').each((i, el) => {
            const lang = $(el).attr('data-name') || '';
            const directUrl = $(el).attr('data-url');
            const serverId = $(el).attr('data-id');
            const serverType = $(el).attr('data-tipo');
            const serverName = $(el).text().trim();
            
            if (lang.toLowerCase().includes('latino')) {
                const urlToUse = directUrl || serverId;
                if (urlToUse && !seenUrls.has(urlToUse)) {
                    seenUrls.add(urlToUse);
                    rawResults.push({
                        serverName,
                        serverUrl: directUrl,
                        serverId,
                        serverType,
                        language: 'Latino'
                    });
                }
            }
        });

        if (rawResults.length === 0) {
            console.log(`[PelisPlus] No Latino servers in playurl. Trying universal scan...`);
            $('li[data-url]').each((i, el) => {
                const sUrl = $(el).attr('data-url');
                let sName = $(el).attr('data-name') || $(el).text() || '';
                if (sUrl && (sName.toLowerCase().includes('latino') || ($(el).attr('title') || '').toLowerCase().includes('latino'))) {
                    rawResults.push({ serverUrl: sUrl, serverName: sName, language: 'Latino' });
                }
            });
        }

        if (rawResults.length === 0) {
            console.log(`[PelisPlus] Trying Span Data (#link_url)...`);
            const isLatinoPage = pageHtml.includes('Español Latino');
            if (isLatinoPage) {
                $('#link_url span').each((i, el) => {
                    const sUrl = $(el).attr('url');
                    const lid = $(el).attr('lid');
                    if (sUrl) {
                        const sName = $(`li[data-id="${lid}"] a`).text().trim() || 'Servidor';
                        rawResults.push({ serverUrl: sUrl, serverName: sName, language: 'Latino' });
                    }
                });
            }
        }

        if (rawResults.length === 0) {
            console.log(`[PelisPlus] Trying legacy var options...`);
            const optionsMatch = pageHtml.match(/var\s+options\s*=\s*({[\s\S]*?});/i);
            if (optionsMatch) {
                try {
                    const options = JSON.parse(optionsMatch[1].replace(/'/g, '"').replace(/,\s*}/g, '}'));
                    for (const key in options) {
                        if (key.toLowerCase().includes('latino')) {
                            options[key].forEach((item) => {
                                if (item.url && !seenUrls.has(item.url)) {
                                    seenUrls.add(item.url);
                                    rawResults.push({ serverUrl: item.url, serverName: item.name || key, language: key });
                                }
                            });
                        }
                    }
                } catch {}
            }
        }

        if (rawResults.length === 0) {
            console.log(`[PelisPlus] Trying iframe sources...`);
            $('iframe[src]').each((i, el) => {
                const src = $(el).attr('src');
                if (src && src.startsWith('http') && !src.includes('+url+') && !src.includes("'+url+'") && !src.includes("'+link+'")) {
                    if (!seenUrls.has(src)) {
                        seenUrls.add(src);
                        rawResults.push({ serverUrl: src, serverName: 'Servidor', language: 'Latino' });
                    }
                }
            });
        }

        console.log(`[PelisPlus] Resolving ${rawResults.length} sources...`);
        
        const candidates = [];
        const controller = new AbortController();
        const signal = controller.signal;
        let isFinished = false;
        const TARGET_COUNT = 15;

        const processStream = async (res) => {
            if (isFinished) return null;
            try {
                let embedUrl = res.serverUrl;
                
                if (!embedUrl && res.serverId) {
                    const embedRes = await fetchJson(`${BASE_URL}/ajax/embed?id=${res.serverId}&tipo=${res.serverType}`);
                    embedUrl = embedRes.url || embedRes;
                }
                
                if (!embedUrl || isFinished) return null;
                
                const finalUrl = await resolveEmbed(embedUrl, signal);
                if (!finalUrl || isFinished) return null;
                
                const directUrl = typeof finalUrl === 'string' ? finalUrl : finalUrl.url;
                const headers = typeof finalUrl === 'object' && finalUrl.headers ? finalUrl.headers : { 'Referer': BASE_URL };
                
                const streamData = {
                    url: directUrl,
                    quality: 'HD',
                    language: 'Latino',
                    serverLabel: res.serverName,
                    headers
                };
                
                const vStream = await validateStream(streamData, signal);
                const result = vStream && vStream.verified ? vStream : streamData;
                
                if (!isFinished && result) {
                    candidates.push(result);
                    if (candidates.length >= TARGET_COUNT) {
                        isFinished = true;
                        try { controller.abort(); } catch {}
                    }
                }
                
                return result;
            } catch {
                return null;
            }
        };

        let timeoutId;
        const STREAM_LIMIT = 3;
        new Promise((resolve) => {
            timeoutId = setTimeout(() => {
                isFinished = true;
                try { controller.abort(); } catch {}
                resolve();
            }, 10000);
        });

        try {
            const batches = [];
            for (let i = 0; i < rawResults.length; i += STREAM_LIMIT) {
                batches.push(rawResults.slice(i, i + STREAM_LIMIT));
            }
            for (const batch of batches) {
                if (isFinished) break;
                await Promise.all(batch.map(res => processStream(res)));
            }
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }

        return candidates.map(s => ({
            name: 'PelisPlus',
            title: `${s.language || 'Latino'} - ${s.serverLabel || 'Servidor'}`,
            url: s.url,
            quality: s.quality || 'HD',
            headers: s.headers || {}
        }));
        
    } catch (error) {
        console.error('[PelisPlus] Error:', error.message);
        return [];
    }
}