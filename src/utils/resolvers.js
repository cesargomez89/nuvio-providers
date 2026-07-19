const { resolve: resolveVoe } = require('../resolvers/voe.js');
const { resolve: resolveHlswish } = require('../resolvers/hlswish.js');
const { resolve: resolveFilemoon } = require('../resolvers/filemoon.js');
const { resolve: resolveVidhide } = require('../resolvers/vidhide.js');
const { resolve: resolveDoodstream } = require('../resolvers/doodstream.js');
const { resolve: resolveDropcdn } = require('../resolvers/dropcdn.js');
const { resolve: resolveGoodstream } = require('../resolvers/goodstream.js');
const { resolve: resolveFastream } = require('../resolvers/fastream.js');
const { resolve: resolveVimeos } = require('../resolvers/vimeos.js');
const { resolve: resolveSupervideo } = require('../resolvers/supervideo.js');
const { resolve: resolvePixeldrain } = require('../resolvers/pixeldrain.js');
const { resolve: resolveLulustream } = require('../resolvers/lulustream.js');
const { resolve: resolveOkru } = require('../resolvers/okru.js');
const { resolve: resolveEmbed69 } = require('../resolvers/embed69.js');
const { resolve: resolveXupalace } = require('../resolvers/xupalace.js');
const { resolve: resolveMixdrop } = require('../resolvers/mixdrop.js');
const { resolve: resolveVerhdlink } = require('../resolvers/verhdlink.js');
const { resolve: resolveStreamtape } = require('../resolvers/streamtape.js');
const { resolve: resolvePlayhydrax } = require('../resolvers/playhydrax.js');
const { resolve: resolveSololatino } = require('../resolvers/sololatino.js');
const { resolve: resolveKrakenfiles } = require('../resolvers/krakenfiles.js');
const { resolve: resolveUnlimplay } = require('../resolvers/unlimplay.js');
const { resolve: resolveVibuxer } = require('../resolvers/vibuxer.js');
const { resolve: resolveEmturbovid } = require('../resolvers/emturbovid.js');
const { resolve: resolveBuzzheavier } = require('../resolvers/buzzheavier.js');
const { resolve: resolveTplayer } = require('../resolvers/tplayer.js');
const { resolve: resolveVidsrc } = require('../resolvers/vidsrc.js');
const { resolve: resolveEmbedseek } = require('../resolvers/embedseek.js');
const { resolve: resolveVidnest } = require('../resolvers/vidnest.js');
const { resolve: resolveVidsonic } = require('../resolvers/vidsonic.js');
const { resolve: resolveBarmonrey } = require('../resolvers/barmonrey.js');
const { resolve: resolveVidmoly } = require('../resolvers/vidmoly.js');
const { resolve: resolveRpmvid } = require('../resolvers/rpmvid.js');
const { resolve: resolvePlaymogo } = require('../resolvers/playmogo.js');
const { resolve: resolveGeneric } = require('../resolvers/generic_fuegocine.js');
const { withTimeout } = require('../utils/parallel.js');
const { isMirror } = require('../utils/mirrors.js');
const { getSessionUA } = require('../utils/http.js');

const UA = getSessionUA();

const DEAD_DOMAINS = ['supervideo', 'mixdrop', 'verhdlink', 'waaw.to'];

function getDirectCdnHeaders(url) {
  if (!url) return null;
  const { getStealthHeaders } = require('../utils/http.js');
  const s = url.toLowerCase();
  try {
    const domain = new URL(url).hostname;
    const baseOrigin = `https://${domain}`;
    const headers = {
      ...getStealthHeaders(),
      Referer: baseOrigin,
      Origin: baseOrigin,
    };
    if (isMirror(s, 'FILEMOON') || isMirror(s, 'VIDHIDE')) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
      headers['x-embed-origin'] = domain;
      if (isMirror(s, 'FILEMOON')) {
        headers['x-embed-origin'] = 'ww3.gnulahd.nu';
        headers['x-embed-parent'] = baseOrigin;
      }
    }
    return headers;
  } catch {
    return { 'User-Agent': UA, referer: url.split('?')[0] };
  }
}

function applyPiping(result) {
  if (!result || !result.url) return result;
  let url = result.url;
  const s = url.toLowerCase();
  const isDirectFile =
    s.includes('pixeldrain') ||
    s.includes('buzzheavier') ||
    s.includes('tplayer') ||
    result.isDirect;
  const anchor = isDirectFile ? '#.mp4' : '';
  if (anchor && !url.includes('.m3u8') && !url.includes('.mp4')) {
    url = `${url}${anchor}`;
  }
  result.url = url;
  return result;
}

async function resolveEmbed(url, signal = null) {
  if (!url) return null;
  return withTimeout(_resolveEmbed(url, signal), 15000).catch(() => null);
}

async function _resolveEmbed(url, signal = null) {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (DEAD_DOMAINS.some((d) => urlLower.includes(d))) return null;
  if (
    isMirror(urlLower, 'VOE') ||
    url.includes('voe.sx') ||
    url.includes('voe-') ||
    url.includes('voex.sx')
  ) {
    const result = await withTimeout(resolveVoe(url, signal), 5000);
    if (result) return result;
  }
  if (
    isMirror(urlLower, 'STREAMWISH') ||
    url.includes('streamwish') ||
    url.includes('hlswish') ||
    url.includes('filelions')
  ) {
    const result = await withTimeout(resolveHlswish(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'FILEMOON') || url.includes('filemoon')) {
    const result = await withTimeout(resolveFilemoon(url, signal), 5000);
    if (result) return result;
  }
  if (
    isMirror(urlLower, 'VIDHIDE') ||
    url.includes('vidhide') ||
    url.includes('vidhidepro') ||
    url.includes('vidoza')
  ) {
    const result = await withTimeout(resolveVidhide(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'DOODSTREAM')) {
    const result = await withTimeout(resolveDoodstream(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'DROPCDN')) {
    const result = await withTimeout(resolveDropcdn(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'GOODSTREAM') || url.includes('goodstream') || url.includes('gs.one')) {
    const result = await withTimeout(resolveGoodstream(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'FASTREAM') || url.includes('fastream') || url.includes('fembed')) {
    const result = await withTimeout(resolveFastream(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('vimeos') || url.includes('vimeo') || url.includes('vms.sh')) {
    const result = await withTimeout(resolveVimeos(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('supervideo')) {
    const result = await withTimeout(resolveSupervideo(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'PIXELDRAIN')) {
    const result = await withTimeout(resolvePixeldrain(url, signal), 5000);
    if (result) return applyPiping(result);
  }
  if (isMirror(urlLower, 'LULUSTREAM')) {
    const result = await withTimeout(resolveLulustream(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'OKRU')) {
    const result = await withTimeout(resolveOkru(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('embed69.org') || url.includes('embed69')) {
    const result = await withTimeout(resolveEmbed69(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('xupalace.org') || url.includes('xupalace')) {
    const result = await withTimeout(resolveXupalace(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('mixdrop') || url.includes('m1xdrop')) {
    const result = await withTimeout(resolveMixdrop(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('verhdlink')) {
    const result = await withTimeout(resolveVerhdlink(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('streamtape') || url.includes('bysejikuar')) {
    const result = await withTimeout(resolveStreamtape(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('playhydrax')) {
    const result = await withTimeout(resolvePlayhydrax(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('sololatino.xyz')) {
    const result = await withTimeout(resolveSololatino(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('krakenfiles')) {
    const result = await withTimeout(resolveKrakenfiles(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('unlimplay')) {
    const result = await withTimeout(resolveUnlimplay(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('vibuxer')) {
    const result = await withTimeout(resolveVibuxer(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('emturbovid') || url.includes('turbovidhls')) {
    const result = await withTimeout(resolveEmturbovid(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('buzzheavier') || url.includes('bzh.sh')) {
    const result = await withTimeout(resolveBuzzheavier(url, signal), 5000);
    if (result) return applyPiping(result);
  }
  if (url.includes('tplayer.pelisgo.online')) {
    const result = await withTimeout(resolveTplayer(url, signal), 5000);
    if (result) return applyPiping(result);
  }
  if (url.includes('vidsrc') || url.includes('moviesapi.to') || url.includes('moviesapi.club')) {
    const result = await withTimeout(resolveVidsrc(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('embedseek') || url.includes('seekplays') || url.includes('seekstreaming')) {
    const result = await withTimeout(resolveEmbedseek(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'VIDNEST')) {
    const result = await withTimeout(resolveVidnest(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'VIDSONIC')) {
    const result = await withTimeout(resolveVidsonic(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'BARMONREY')) {
    const result = await withTimeout(resolveBarmonrey(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'VIDMOLY')) {
    const result = await withTimeout(resolveVidmoly(url, signal), 5000);
    if (result) return result;
  }
  if (isMirror(urlLower, 'UPNS')) {
    const result = await withTimeout(resolveRpmvid(url, signal), 5000);
    if (result) return result;
  }
  if (url.includes('playmogo')) {
    const result = await withTimeout(resolvePlaymogo(url, signal), 5000);
    if (result) return applyPiping(result);
  }
  if (isMirror(urlLower, 'UNLIMPLAY') || isMirror(urlLower, 'KRAKENFILES')) {
    const result = await withTimeout(resolveGeneric(url, signal), 5000);
    if (result) return result;
  }

  const headers = getDirectCdnHeaders(url);
  return applyPiping({
    url,
    quality: 'SD',
    verified: false,
    headers,
  });
}

module.exports = { resolveEmbed, getDirectCdnHeaders, applyPiping };
