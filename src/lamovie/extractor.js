import { fetchJson, fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const BASE_URL = "https://la.movie";
const API_URL = "https://la.movie/wp-api/v1";
const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
};

function normalizeQuality(quality) {
    const str = quality.toString().toLowerCase();
    const match = str.match(/(\d+)/);
    if (match) return match[1] + "p";
    if (str.indexOf("4k") !== -1 || str.indexOf("uhd") !== -1) return "2160p";
    if (str.indexOf("full") !== -1 || str.indexOf("fhd") !== -1) return "1080p";
    if (str.indexOf("hd") !== -1) return "720p";
    return "SD";
}

function getServerName(url) {
    if (url.indexOf("goodstream") !== -1) return "GoodStream";
    if (url.indexOf("hlswish") !== -1 || url.indexOf("streamwish") !== -1 || url.indexOf("strwish") !== -1 || url.indexOf("vibuxer") !== -1) return "StreamWish";
    if (url.indexOf("voe.sx") !== -1) return "VOE";
    if (url.indexOf("filemoon") !== -1) return "Filemoon";
    if (url.indexOf("vimeos.net") !== -1) return "Vimeos";
    if (url.indexOf("dood") !== -1 || url.indexOf("d0000d") !== -1) return "DoodStream";
    return "Online";
}

function buildSlug(title, year) {
    const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return year ? slug + "-" + year : slug;
}

async function httpGet(url, extraHeaders = {}) {
    const headers = { ...DEFAULT_HEADERS, ...extraHeaders };
    const res = await fetch(url, { headers, redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
    const ct = res.headers.get("content-type") || "";
    if (ct.indexOf("json") !== -1) return res.json();
    return res.text();
}

async function getTmdbData(tmdbId, mediaType) {
    const type = mediaType === "movie" ? "movie" : "tv";
    const attempts = [
        { lang: "es-MX", name: "Latino" },
        { lang: "en-US", name: "Inglés" }
    ];

    async function tryLang(lang, name) {
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${lang}`;
        const data = await httpGet(url);
        const title = type === "movie" ? data.title : data.name;
        const originalTitle = type === "movie" ? data.original_title : data.original_name;
        if (lang === "es-MX" && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(title)) {
            throw new Error("CJK in Spanish");
        }
        console.log(`[LaMovie] TMDB (${name}): "${title}"${title !== originalTitle ? ` | Original: "${originalTitle}"` : ""}`);
        const year = (type === "movie" ? data.release_date || "" : data.first_air_date || "").slice(0, 4);
        const genresArr = (data.genres || []).map(g => g.id);
        const originCountries = data.origin_country || (data.production_countries || []).map(c => c.iso_3166_1) || [];
        return { title, originalTitle, year, genres: genresArr, originCountries };
    }

    try {
        return await tryLang(attempts[0].lang, attempts[0].name);
    } catch (e) {
        console.log(`[LaMovie] Error TMDB Latino: ${e.message}`);
        return await tryLang(attempts[1].lang, attempts[1].name);
    }
}

function extractIdFromHtml(html) {
    const match = html.match(/rel=['"]shortlink['"]\s+href=['"][^'"]*\?p=(\d+)['"]/);
    return match ? match[1] : null;
}

async function getIdBySlug(category, slug) {
    const url = BASE_URL + "/" + category + "/" + slug + "/";
    try {
        const html = await httpGet(url, { "Accept": "text/html" });
        const id = extractIdFromHtml(html);
        if (id) {
            console.log(`[LaMovie] ✓ Slug directo: /${category}/${slug} → id:${id}`);
            return { id };
        }
        return null;
    } catch {
        return null;
    }
}

async function findBySlug(tmdbInfo, mediaType) {
    const { title, originalTitle, year, genres, originCountries } = tmdbInfo;
    const isMovie = mediaType === "movie";
    const GENRE_ANIMATION = 16;
    const ANIME_COUNTRIES = ["JP", "CN", "KR"];

    let categories;
    if (isMovie) {
        categories = ["peliculas"];
    } else {
        const isAnimation = (genres || []).includes(GENRE_ANIMATION);
        if (!isAnimation) {
            categories = ["series"];
        } else {
            const isAnimeCountry = (originCountries || []).some(c => ANIME_COUNTRIES.includes(c));
            categories = isAnimeCountry ? ["animes"] : ["animes", "series"];
        }
    }

    const slugs = [];
    if (title) slugs.push(buildSlug(title, year));
    if (originalTitle && originalTitle !== title) slugs.push(buildSlug(originalTitle, year));

    async function trySlug(slug, cats) {
        if (cats.length === 1) {
            return await getIdBySlug(cats[0], slug);
        }
        const results = await Promise.all(cats.map(cat => getIdBySlug(cat, slug).catch(() => null)));
        for (const r of results) {
            if (r) return r;
        }
        return null;
    }

    async function tryAllSlugs(idx) {
        if (idx >= slugs.length) return null;
        const result = await trySlug(slugs[idx], categories);
        if (result) return result;
        return await tryAllSlugs(idx + 1);
    }

    return await tryAllSlugs(0);
}

async function getEpisodeId(seriesId, seasonNum, episodeNum) {
    const url = API_URL + "/single/episodes/list?_id=" + seriesId + "&season=" + seasonNum + "&page=1&postsPerPage=50";
    try {
        const data = await httpGet(url);
        if (!data || !data.data || !data.data.posts) return null;
        const posts = data.data.posts;
        for (const e of posts) {
            if (String(e.season_number) === String(seasonNum) && String(e.episode_number) === String(episodeNum)) {
                console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} id:${e._id}`);
                return String(e._id);
            }
        }
        console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} no encontrado`);
        return null;
    } catch (err) {
        console.log(`[LaMovie] Error episodios: ${err.message}`);
        return null;
    }
}

async function processEmbed(embed) {
    const resolved = await resolveEmbed(embed.url);
    if (!resolved || !resolved.url) {
        console.log("[LaMovie] Sin resolver para: " + embed.url);
        return null;
    }
    const quality = normalizeQuality(embed.quality || "1080p");
    const serverName = getServerName(embed.url);
    return {
        name: "LaMovie",
        title: quality + " · " + serverName,
        url: resolved.url,
        quality,
        headers: resolved.headers || {},
        serverLabel: serverName,
        langLabel: "Latino"
    };
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId || !mediaType) return [];
    const startTime = Date.now();
    const resolvedType = mediaType === "series" ? "tv" : mediaType || "movie";

    console.log(`[LaMovie] Buscando: TMDB ${tmdbId} (${resolvedType})${season ? ` S${season}E${episode}` : ""}`);

    try {
        const tmdbInfo = await getTmdbData(tmdbId, resolvedType);
        if (!tmdbInfo) return [];

        const found = await findBySlug(tmdbInfo, resolvedType);
        if (!found) {
            console.log("[LaMovie] No encontrado por slug");
            return [];
        }

        let targetId = found.id;

        if (resolvedType === "tv" && season && episode) {
            const epId = await getEpisodeId(targetId, season, episode);
            if (!epId) {
                console.log(`[LaMovie] Episodio S${season}E${episode} no encontrado`);
                return [];
            }
            targetId = epId;
        }

        if (!targetId || !targetId.length) return [];

        const data = await httpGet(API_URL + "/player?postId=" + targetId + "&demo=0");
        if (!data || !data.data || !data.data.embeds) {
            console.log("[LaMovie] No hay embeds disponibles");
            return [];
        }

        const embeds = data.data.embeds;
        const results = await Promise.all(embeds.map(processEmbed));
        const streams = results.filter(r => r);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[LaMovie] ✓ ${streams.length} streams en ${elapsed}s`);

        return await finalizeStreams(streams, "LaMovie", tmdbInfo.title);
    } catch (err) {
        console.log(`[LaMovie] Error: ${err.message}`);
        return [];
    }
}