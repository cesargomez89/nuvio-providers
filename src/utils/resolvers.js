const { resolve: resolveVoe } = require('../resolvers/voe.js');
const { resolve: resolveHlswish } = require('../resolvers/hlswish.js');
const { resolve: resolveFilemoon } = require('../resolvers/filemoon.js');
const { resolve: resolveVidhide } = require('../resolvers/vidhide.js');
const { resolve: resolveGoodstream } = require('../resolvers/goodstream.js');
const { resolve: resolveFastream } = require('../resolvers/fastream.js');
const { resolve: resolveVimeos } = require('../resolvers/vimeos.js');
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
  if (isMirror(urlLower, "VOE") || url.includes("voe.sx") || url.includes("voe-") || url.includes("voex.sx"))
    return await resolveVoe(url, signal);
  if (isMirror(urlLower, "STREAMWISH") || url.includes("streamwish") || url.includes("hlswish") || url.includes("filelions"))
    return await resolveHlswish(url, signal);
  if (isMirror(urlLower, "FILEMOON") || url.includes("filemoon"))
    return await resolveFilemoon(url, signal);
  if (isMirror(urlLower, "VIDHIDE") || url.includes("vidhide") || url.includes("vidhidepro") || url.includes("vidoza"))
    return await resolveVidhide(url, signal);
  if (url.includes("goodstream") || url.includes("gs.one"))
    return await resolveGoodstream(url);
  if (url.includes("fastream") || url.includes("fembed"))
    return await resolveFastream(url);
  if (url.includes("vimeos") || url.includes("vimeo") || url.includes("vms.sh"))
    return await resolveVimeos(url);
  
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