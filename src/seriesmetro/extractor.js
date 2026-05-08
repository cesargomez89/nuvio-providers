import { fetchHtml, request, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbAliases } from '../utils/tmdb.js';
import { buildSlug } from '../utils/title.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE = "https://www3.seriesmetro.net";

const LANG_PRIORITY = ["latino", "lat", "castellano", "español", "esp", "vose", "sub", "subtitulado"];

const LANG_MAP = {
    "latino": "Latino",
    "lat": "Latino",
    "castellano": "Castellano",
    "español": "Castellano",
    "esp": "Castellano",
    "vose": "Subtitulado",
    "sub": "Subtitulado",
    "subtitulado": "Subtitulado"
};

function getBaseHeaders(referer) {
    return {
        ...getStealthHeaders(),
        "Accept-Language": "es-MX,es;q=0.9",
        "Referer": referer || BASE
    };
}

async function findContentUrl(tmdbInfo, mediaType) {
    const { title, originalTitle, aliases = [] } = tmdbInfo;
    const category = isMovie(mediaType) ? "pelicula" : "serie";

    const searchTerms = [title, originalTitle].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    if (searchTerms.length === 0) return null;

    console.log(`[SeriesMetro] Probando Discovery paralelo para: ${searchTerms[0]}`);

    const validateUrl = async (url) => {
        try {
            const data = await fetchHtml(url, { headers: getBaseHeaders(url) });
            if (data && (data.includes("trembed=") || data.includes("data-post="))) {
                return { url, html: data };
            }
        } catch {}
        return null;
    };

    const slugResults = await Promise.all(
        searchTerms.map(t => validateUrl(`${BASE}/${category}/${buildSlug(t)}/`))
    );
    for (const r of slugResults) {
        if (r) {
            console.log(`[SeriesMetro] ✓ Contenido encontrado por slug: ${r.url}`);
            return r;
        }
    }

    try {
        const searchHtml = await fetchHtml(`${BASE}/?s=${encodeURIComponent(searchTerms[0])}`, { headers: getBaseHeaders() });
        if (searchHtml) {
            const postRegex = /<article[^>]*class="[^"]*post[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+\/(?:serie|pelicula)\/([^/]+)\/)"[^>]*class="lnk-blk"/g;
            let m;
            while ((m = postRegex.exec(searchHtml)) !== null) {
                const url = m[1];
                if (!url.includes(`/${category}/`)) continue;
                const res = await validateUrl(url);
                if (res) return res;
            }
        }
    } catch {}

    const secondaryTerms = aliases.filter(a => !searchTerms.includes(a)).slice(0, 2);
    for (const term of secondaryTerms) {
        const res = await validateUrl(`${BASE}/${category}/${buildSlug(term)}/`);
        if (res) return res;
    }

    return null;
}

async function getEpisodeUrl(serieUrl, serieHtml, season, episode) {
    const dpostMatch = serieHtml.match(/data-post="(\d+)"/);
    if (!dpostMatch) return null;
    const dpost = dpostMatch[1];

    try {
        const res = await request(`${BASE}/wp-admin/admin-ajax.php`, {
            method: "POST",
            body: new URLSearchParams({ action: "action_select_season", post: dpost, season: String(season) }),
            headers: { ...getBaseHeaders(serieUrl), "Content-Type": "application/x-www-form-urlencoded" }
        });
        const epData = await res.text();
        const epUrls = [...epData.matchAll(/href="([^"]+\/capitulo\/[^"]+)"/g)].map(m => m[1]);
        return epUrls.find(u => {
            const m = u.match(/temporada-(\d+)-capitulo-(\d+)/);
            return m && parseInt(m[1]) === season && parseInt(m[2]) === episode;
        }) || null;
    } catch {
        return null;
    }
}

async function extractStreamsFromPage(pageUrl, referer) {
    try {
        const data = await fetchHtml(pageUrl, { headers: getBaseHeaders(referer) });

        const optionRegex = /href="#options-(\d+)"[^>]*>[\s\S]*?<span class="server">([\s\S]*?)<\/span>/g;
        const options = [];
        let m;
        while ((m = optionRegex.exec(data)) !== null) {
            options.push({ id: m[1], serverRaw: m[2] });
        }

        const tridRegex = /\?trembed=(\d+)(?:&#038;|&)trid=(\d+)(?:&#038;|&)trtype=(\d+)/g;
        const tridMatch = tridRegex.exec(data);
        if (!tridMatch || options.length === 0) return [];

        const trid = tridMatch[2];
        const trtype = tridMatch[3];

        options.sort((a, b) => {
            const aLang = a.serverRaw.replace(/<[^>]+>/g, "").split("-").pop().trim().toLowerCase();
            const bLang = b.serverRaw.replace(/<[^>]+>/g, "").split("-").pop().trim().toLowerCase();
            const ai = LANG_PRIORITY.indexOf(aLang);
            const bi = LANG_PRIORITY.indexOf(bLang);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        const resolveTask = async (option) => {
            try {
                const srvText = option.serverRaw.replace(/<[^>]+>/g, "").trim();
                const langRaw = srvText.split("-").pop().trim().toLowerCase();
                const lang = LANG_MAP[langRaw] || langRaw;

                const embedPage = await fetchHtml(
                    `${BASE}/?trembed=${option.id}&trid=${trid}&trtype=${trtype}`,
                    { headers: getBaseHeaders(pageUrl) }
                );

                const iframeMatch = embedPage.match(/<iframe[^>]*src="([^"]+)"/i);
                if (!iframeMatch) return null;

                const result = await resolveEmbed(iframeMatch[1]);
                if (result) {
                    return {
                        langLabel: lang,
                        serverLabel: result.serverName || "Server",
                        url: result.url,
                        quality: result.quality || "1080p",
                        verified: result.verified !== false,
                        headers: result.headers || getBaseHeaders()
                    };
                }
            } catch {}
            return null;
        };

        const batch = options.slice(0, 6);
        const results = await parallelWithLimit(batch, resolveTask, 5);
        return results.filter(Boolean);

    } catch {
        return [];
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId || !mediaType) return [];

    try {
        const realId = cleanTmdbId(tmdbId);

        let tmdbInfo = { title, originalTitle: title, aliases: [] };
        if (realId) {
            const aliases = await getTmdbAliases(realId, mediaType);
            tmdbInfo = {
                title: aliases[1] || aliases[0] || title,
                originalTitle: aliases[0] || title,
                aliases
            };
        }

        if (!tmdbInfo.title) return [];

        const found = await findContentUrl(tmdbInfo, mediaType);
        if (!found) {
            console.log(`[SeriesMetro] ✗ No se encontró contenido para: ${tmdbInfo.title}`);
            return [];
        }

        let targetUrl = found.url;
        if (!isMovie(mediaType) && season && episode) {
            const epUrl = await getEpisodeUrl(found.url, found.html, parseInt(season), parseInt(episode));
            if (!epUrl) return [];
            targetUrl = epUrl;
        }

        const streams = await extractStreamsFromPage(targetUrl, found.url);
        return await finalizeStreams(streams, "SeriesMetro", tmdbInfo.title);

    } catch (e) {
        console.log(`[SeriesMetro] Error: ${e.message}`);
        return [];
    }
}
