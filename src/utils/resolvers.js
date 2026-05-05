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
const { isMirror } = require('../utils/mirrors.js');
const { getSessionUA } = require('../utils/http.js');

const UA = getSessionUA();

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