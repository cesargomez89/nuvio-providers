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
const { isMirror } = require('../utils/mirrors.js');
const { getSessionUA } = require('../utils/http.js');

const UA = getSessionUA();

const DEAD_DOMAINS = [
  "supervideo",
  "voe.sx",
  "mixdrop",
  "verhdlink",
  "waaw.to"
];

function getDirectCdnHeaders(url) {
  if (!url)
    return null;
  const { getStealthHeaders } = require('../utils/http.js');
  const s = url.toLowerCase();
  try {
    const domain = new URL(url).hostname;
    const baseOrigin = `https://${domain}`;
    const headers = {
      ...getStealthHeaders(),
      "Referer": baseOrigin,
      "Origin": baseOrigin
    };
    if (isMirror(s, "FILEMOON") || isMirror(s, "VIDHIDE")) {
      headers["X-Requested-With"] = "XMLHttpRequest";
      headers["x-embed-origin"] = domain;
      if (isMirror(s, "FILEMOON")) {
        headers["x-embed-origin"] = "ww3.gnulahd.nu";
        headers["x-embed-parent"] = baseOrigin;
      }
    }
    return headers;
  } catch (e) {
    return { "User-Agent": UA, "referer": url.split("?")[0] };
  }
}

async function resolveEmbed(url, signal = null) {
  if (!url)
    return null;
  const urlLower = url.toLowerCase();
  if (DEAD_DOMAINS.some(d => urlLower.includes(d)))
    return null;
  if (isMirror(urlLower, "VOE") || url.includes("voe.sx") || url.includes("voe-") || url.includes("voex.sx")) {
    const result = await resolveVoe(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "STREAMWISH") || url.includes("streamwish") || url.includes("hlswish") || url.includes("filelions")) {
    const result = await resolveHlswish(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "FILEMOON") || url.includes("filemoon")) {
    const result = await resolveFilemoon(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "VIDHIDE") || url.includes("vidhide") || url.includes("vidhidepro") || url.includes("vidoza")) {
    const result = await resolveVidhide(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "DOODSTREAM")) {
    const result = await resolveDoodstream(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "DROPCDN")) {
    const result = await resolveDropcdn(url);
    if (result) return result;
  }
  if (isMirror(urlLower, "GOODSTREAM") || url.includes("goodstream") || url.includes("gs.one")) {
    const result = await resolveGoodstream(url);
    if (result) return result;
  }
  if (isMirror(urlLower, "FASTREAM") || url.includes("fastream") || url.includes("fembed")) {
    const result = await resolveFastream(url);
    if (result) return result;
  }
  if (url.includes("vimeos") || url.includes("vimeo") || url.includes("vms.sh")) {
    const result = await resolveVimeos(url);
    if (result) return result;
  }
  if (url.includes("supervideo")) {
    const result = await resolveSupervideo(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "PIXELDRAIN")) {
    const result = await resolvePixeldrain(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "LULUSTREAM")) {
    const result = await resolveLulustream(url, signal);
    if (result) return result;
  }
  if (isMirror(urlLower, "OKRU")) {
    const result = await resolveOkru(url, signal);
    if (result) return result;
  }
  if (url.includes("embed69.org") || url.includes("embed69")) {
    const result = await resolveEmbed69(url, signal);
    if (result) return result;
  }
  if (url.includes("xupalace.org") || url.includes("xupalace")) {
    const result = await resolveXupalace(url, signal);
    if (result) return result;
  }
  if (url.includes("mixdrop") || url.includes("m1xdrop")) {
    const result = await resolveMixdrop(url, signal);
    if (result) return result;
  }
  if (url.includes("verhdlink")) {
    const result = await resolveVerhdlink(url, signal);
    if (result) return result;
  }
  if (url.includes("streamtape") || url.includes("bysejikuar")) {
    const result = await resolveStreamtape(url, signal);
    if (result) return result;
  }
  if (url.includes("playhydrax")) {
    const result = await resolvePlayhydrax(url, signal);
    if (result) return result;
  }
  if (url.includes("sololatino.xyz")) {
    const result = await resolveSololatino(url, signal);
    if (result) return result;
  }
  if (url.includes("krakenfiles")) {
    const result = await resolveKrakenfiles(url, signal);
    if (result) return result;
  }
  if (url.includes("unlimplay")) {
    const result = await resolveUnlimplay(url, signal);
    if (result) return result;
  }
  if (url.includes("vibuxer")) {
    const result = await resolveVibuxer(url, signal);
    if (result) return result;
  }
  if (url.includes("emturbovid") || url.includes("turbovidhls")) {
    const result = await resolveEmturbovid(url, signal);
    if (result) return result;
  }
  
  // Fallback: return URL with direct CDN headers for unmatched URLs
  // This ensures we don't lose valid stream URLs
  const headers = getDirectCdnHeaders(url);
  return {
    url,
    quality: "SD",
    verified: false,
    headers
  };
}

module.exports = { resolveEmbed, getDirectCdnHeaders };