import { fetchHtml, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo, getTmdbAliases } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { buildSlug } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE = 'https://detodopeliculas.nu';
const HEADERS = {
  ...getStealthHeaders(),
  'Accept-Language': 'es-MX,es;q=0.9',
  Referer: `${BASE}/`,
};

function extractSrc(embedHtml) {
  if (!embedHtml) return null;
  const m = embedHtml.match(/src=["']([^"']+)["']/i);
  return m ? m[1] : embedHtml;
}

async function getPage(url) {
  return fetchHtml(url, { headers: HEADERS });
}

async function findPageUrl(titles, mediaType) {
  const typePath = isMovie(mediaType) ? 'pelicula' : 'serie';
  const candidates = [];
  for (const t of titles) {
    const slug = buildSlug(t.title);
    if (!slug) continue;
    candidates.push(`${BASE}/${typePath}/${slug}/`);
    if (t.year) candidates.push(`${BASE}/${typePath}/${slug}-${t.year}/`);
  }
  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const html = await getPage(url);
        if (html && html.includes('dooplay_player_option')) return url;
      } catch {}
      return null;
    })
  );
  return results.find((r) => r !== null);
}

async function findEpisodeUrl(seriesUrl, season, episode) {
  try {
    const html = await getPage(`${seriesUrl}?ep_season=${season}`);
    const epcardRegex = /<a[^>]*class="fv2-epcard"[^>]*>[\s\S]*?<\/a>/gi;
    let match;
    while ((match = epcardRegex.exec(html)) !== null) {
      const card = match[0];
      const epnumMatch = card.match(/data-epnum="(\d+)×(\d+)"/);
      if (epnumMatch && parseInt(epnumMatch[1]) === season && parseInt(epnumMatch[2]) === episode) {
        const hrefMatch = card.match(/href="([^"]+)"/);
        if (hrefMatch) return hrefMatch[1];
      }
    }
  } catch {}
  return null;
}

function parseFV2PL(html) {
  const match = html.match(/window\.FV2_PL\s*=\s*({[^;]+});/);
  if (!match) return null;
  try {
    let raw = match[1].replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapLang(lang) {
  const l = (lang || '').toLowerCase();
  if (l.includes('lat')) return 'LAT';
  if (l.includes('cast') || l.includes('espa')) return 'ESP';
  return 'SUB';
}

async function getServerOptions(pageUrl) {
  const html = await getPage(pageUrl);

  const pl = parseFV2PL(html);
  if (pl && pl.servers && pl.servers.length && pl.post) {
    const ajaxUrl = pl.ajax || `${BASE}/wp-admin/admin-ajax.php`;
    return pl.servers.map((s) => ({
      post: pl.post,
      nume: s.nume,
      ajaxUrl,
      type: 'movie',
      lang: mapLang(s.lang),
    }));
  }

  const options = [];
  const optionRegex =
    /<li[^>]*class=["'][^"']*dooplay_player_option[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = optionRegex.exec(html)) !== null) {
    const block = match[0];
    const text = match[1].toLowerCase();
    const postMatch = block.match(/data-post=["']([^"']+)["']/i);
    const numeMatch = block.match(/data-nume=["']([^"']+)["']/i);
    const typeMatch = block.match(/data-type=["']([^"']+)["']/i);
    if (!postMatch || !numeMatch || !typeMatch) continue;
    let lang = 'SUB';
    if (text.includes('lat') || text.includes('latino') || text.includes('mx')) {
      lang = 'LAT';
    } else if (text.includes('cast') || text.includes('espa\u00f1ol') || text.includes('es ')) {
      lang = 'ESP';
    }
    options.push({
      post: postMatch[1],
      nume: numeMatch[1],
      type: typeMatch[1],
      ajaxUrl: `${BASE}/wp-admin/admin-ajax.php`,
      lang,
    });
  }
  return options;
}

async function resolveServerOption(option, pageUrl) {
  try {
    const body = new URLSearchParams();
    body.append('action', 'doo_player_ajax');
    body.append('post', option.post);
    body.append('nume', option.nume);
    body.append('type', option.type);
    const res = await fetch(option.ajaxUrl, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: pageUrl,
      },
      body: body.toString(),
    });
    const data = await res.json();
    const embedUrl = extractSrc(data?.embed_url);
    if (
      !embedUrl ||
      data?.type === 'trailer' ||
      !embedUrl.startsWith('http') ||
      embedUrl.includes('youtube.com') ||
      embedUrl.includes('googletagmanager')
    )
      return null;
    return { embedUrl, lang: option.lang };
  } catch {
    return null;
  }
}

async function resolveEmbedUrl(item) {
  try {
    const result = await resolveEmbed(item.embedUrl);
    if (!result || !result.url) return null;
    return {
      langLabel:
        item.lang === 'LAT' ? 'Latino' : item.lang === 'ESP' ? 'Castellano' : 'Subtitulado',
      url: result.url,
      quality: result.quality,
      headers: result.headers || {},
    };
  } catch {
    return null;
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || !mediaType) return [];
  const isMovieType = isMovie(mediaType);
  console.log(
    `[DeTodoPeliculas] Buscando: TMDB ${tmdbId} (${mediaType})${season ? ` S${season}E${episode}` : ''}`
  );
  try {
    const realId = cleanTmdbId(tmdbId);
    const tmdbInfo = await getTmdbInfo(realId, mediaType, 'es-MX');
    if (!tmdbInfo || !tmdbInfo.title) return [];
    const titles = [{ title: tmdbInfo.title, year: tmdbInfo.year }];
    let pageUrl = await findPageUrl(titles, mediaType);
    if (!pageUrl) {
      console.log(`[DeTodoPeliculas] Slug directo falló, buscando por alias...`);
      const aliases = await getTmdbAliases(realId, mediaType);
      const aliasTitles = [...new Set(aliases)]
        .filter(Boolean)
        .slice(0, 5)
        .map((t) => ({ title: t, year: tmdbInfo.year }));
      pageUrl = await findPageUrl(aliasTitles, mediaType);
    }
    if (!pageUrl) {
      console.log(`[DeTodoPeliculas] No se encontró página para: ${tmdbInfo.title}`);
      return [];
    }
    console.log(`[DeTodoPeliculas] Página encontrada: ${pageUrl}`);
    if (!isMovieType && season && episode) {
      const epUrl = await findEpisodeUrl(pageUrl, season, episode);
      if (!epUrl) {
        console.log(`[DeTodoPeliculas] No se encontró episodio S${season}E${episode}`);
        return [];
      }
      pageUrl = epUrl;
      console.log(`[DeTodoPeliculas] Episodio: ${pageUrl}`);
    }
    const options = await getServerOptions(pageUrl);
    console.log(`[DeTodoPeliculas] Opciones encontradas: ${options.length}`);
    if (options.length === 0) return [];
    const resolved = await parallelWithLimit(
      options,
      (opt) => resolveServerOption(opt, pageUrl),
      5
    );
    const grouped = { LAT: [], ESP: [], SUB: [] };
    for (const item of resolved) {
      if (
        item &&
        !item.embedUrl.includes('youtube.com') &&
        !item.embedUrl.includes('googletagmanager')
      ) {
        grouped[item.lang].push(item.embedUrl);
      }
    }
    console.log(
      `[DeTodoPeliculas] Embeds: LAT ${grouped.LAT.length}, ESP ${grouped.ESP.length}, SUB ${grouped.SUB.length}`
    );
    const langPriority = ['LAT', 'ESP', 'SUB'];
    for (const lang of langPriority) {
      const urls = grouped[lang];
      if (urls.length === 0) continue;
      const items = urls.map((url) => ({ embedUrl: url, lang }));
      const streams = (await parallelWithLimit(items, resolveEmbedUrl, 5)).filter(Boolean);
      if (streams.length > 0) {
        console.log(`[DeTodoPeliculas] ${streams.length} streams en ${lang}`);
        return await finalizeStreams(streams, 'DeTodoPeliculas');
      }
    }
    return [];
  } catch (e) {
    console.error(`[DeTodoPeliculas] Error: ${e.message}`);
    return [];
  }
}
