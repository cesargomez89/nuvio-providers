/**
 * hackstore2 - Built from src/hackstore2/
 * Generated: 2026-07-19T03:00:50.215Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/utils/http.js
var require_http = __commonJS({
  "src/utils/http.js"(exports2, module2) {
    var DEFAULT_CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var DEFAULT_TIMEOUT = 15e3;
    function getCinebyHeaders() {
      return {
        Accept: "*/*",
        Origin: "https://cineby.sc",
        Referer: "https://cineby.sc/",
        "User-Agent": getSessionUA2()
      };
    }
    var sessionUA = null;
    function setSessionUA(ua) {
      sessionUA = ua;
    }
    function getSessionUA2() {
      return sessionUA || DEFAULT_CHROME_UA;
    }
    function getStealthHeaders2() {
      return {
        "User-Agent": getSessionUA2(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7,es-419;q=0.6",
        Connection: "keep-alive",
        "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      };
    }
    var DEFAULT_UA = getSessionUA2();
    var MOBILE_UA = getSessionUA2();
    function request(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        const opt = options || {};
        const currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA2();
        const headers = Object.assign(
          {
            "User-Agent": currentUA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"
          },
          opt.headers
        );
        try {
          const fetchOptions = Object.assign(
            {
              redirect: opt.redirect || "follow",
              skipSizeCheck: true
            },
            opt,
            {
              headers
            }
          );
          if (opt.signal)
            fetchOptions.signal = opt.signal;
          const response = yield fetch(url, fetchOptions);
          if (opt.redirect === "manual" && (response.status === 301 || response.status === 302)) {
            const redirectUrl = response.headers.get("location");
            response.text().catch(() => {
            });
            console.log(`[HTTP] Redirecci\xF3n detectada (Manual): ${redirectUrl}`);
            return { status: response.status, redirectUrl, ok: false };
          }
          const body = yield response.text();
          if (!response.ok && !opt.ignoreErrors) {
            console.warn("[HTTP] Error " + response.status + " en " + url);
          }
          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            headers: response.headers,
            redirected: response.redirected,
            body,
            text: () => Promise.resolve(body),
            json: () => Promise.resolve(JSON.parse(body))
          };
        } catch (error) {
          console.error("[HTTP] Error en " + url + ": " + error.message);
          throw error;
        }
      });
    }
    function fetchHtml(url, options) {
      return __async(this, null, function* () {
        const res = yield request(url, options);
        return yield res.text();
      });
    }
    function fetchJson2(url, options) {
      return __async(this, null, function* () {
        const res = yield request(url, options);
        return yield res.json();
      });
    }
    function fetchWithTimeout(_0) {
      return __async(this, arguments, function* (url, timeout = DEFAULT_TIMEOUT, options = {}) {
        const hasAbort = typeof AbortController !== "undefined";
        const controller = hasAbort ? new AbortController() : null;
        let timeoutId;
        if (hasAbort)
          timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const result = yield request(url, __spreadProps(__spreadValues({}, options), { signal: hasAbort ? controller.signal : null }));
          clearTimeout(timeoutId);
          return result;
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      });
    }
    module2.exports = {
      request,
      fetchHtml,
      fetchJson: fetchJson2,
      fetchWithTimeout,
      getSessionUA: getSessionUA2,
      setSessionUA,
      getStealthHeaders: getStealthHeaders2,
      getCinebyHeaders,
      DEFAULT_UA,
      MOBILE_UA,
      DEFAULT_TIMEOUT
    };
  }
});

// src/utils/m3u8.js
var require_m3u8 = __commonJS({
  "src/utils/m3u8.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function getQualityFromHeight(height) {
      if (!height)
        return "1080p";
      const h = parseInt(height);
      if (h >= 2160)
        return "4K";
      if (h >= 1440)
        return "1440p";
      if (h >= 1080)
        return "1080p";
      if (h >= 720)
        return "720p";
      if (h >= 480)
        return "480p";
      if (h >= 360)
        return "360p";
      return "1080p";
    }
    function parseBestQuality(content, url = "") {
      let bestHeight = 0;
      let bestBandwidth = 0;
      if (content) {
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.includes("RESOLUTION=")) {
            const match = line.match(/RESOLUTION=\d+x(\d+)/i);
            if (match) {
              const height = parseInt(match[1]);
              if (height > bestHeight)
                bestHeight = height;
            }
          }
          if (line.includes("BANDWIDTH=")) {
            const match = line.match(/BANDWIDTH=(\d+)/i);
            if (match) {
              const bandwidth = parseInt(match[1]);
              if (bandwidth > bestBandwidth)
                bestBandwidth = bandwidth;
            }
          }
        }
      }
      let quality = "1080p";
      let isReal = false;
      if (bestHeight > 0) {
        quality = getQualityFromHeight(bestHeight);
      } else {
        const qMatch = url.match(/([_-]|\/)(\d{3,4})([pP]|(\.m3u8))?/);
        if (qMatch) {
          const h = parseInt(qMatch[2]);
          if (h >= 360 && h <= 4320)
            quality = getQualityFromHeight(h);
        }
      }
      if (bestHeight > 0)
        isReal = true;
      if (bestBandwidth >= 2e6)
        isReal = true;
      return { quality, isReal };
    }
    var VALIDATION_CACHE = /* @__PURE__ */ new Map();
    function validateStream2(stream, signal = null) {
      return __async(this, null, function* () {
        if (!stream || !stream.url)
          return stream;
        const { url, headers } = stream;
        if (VALIDATION_CACHE.has(url))
          return __spreadValues(__spreadValues({}, stream), VALIDATION_CACHE.get(url));
        try {
          const fetchOptions = {
            method: "HEAD",
            headers: __spreadValues({
              "User-Agent": getSessionUA2()
            }, headers || {})
          };
          if (signal)
            fetchOptions.signal = signal;
          const response = yield fetch(url, fetchOptions);
          if (!response.ok) {
            yield response.text().catch(() => {
            });
            return __spreadProps(__spreadValues({}, stream), { verified: false });
          }
          if (stream.quality) {
            const resultData2 = { verified: true, quality: stream.quality, isReal: true };
            VALIDATION_CACHE.set(url, resultData2);
            return __spreadValues(__spreadValues({}, stream), resultData2);
          }
          const isMp4 = url.toLowerCase().includes(".mp4");
          if (isMp4) {
            const resultData2 = { verified: true, quality: "1080p", isReal: true };
            VALIDATION_CACHE.set(url, resultData2);
            return __spreadValues(__spreadValues({}, stream), resultData2);
          }
          fetchOptions.method = "GET";
          const getResponse = yield fetch(url, fetchOptions);
          if (!getResponse.ok) {
            yield getResponse.text().catch(() => {
            });
            return __spreadProps(__spreadValues({}, stream), { verified: false });
          }
          const text = yield getResponse.text();
          const info = parseBestQuality(text, url);
          const resultData = {
            verified: true,
            quality: info.quality,
            isReal: info.isReal
          };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        } catch (e) {
          const info = parseBestQuality("", url);
          const resultData = { quality: info.quality, verified: true, isReal: false };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        }
      });
    }
    module2.exports = { validateStream: validateStream2, getQualityFromHeight };
  }
});

// src/utils/sorting.js
var require_sorting = __commonJS({
  "src/utils/sorting.js"(exports2, module2) {
    var QUALITY_SCORE = {
      "4K": 100,
      "1440p": 90,
      "1080p": 80,
      "720p": 70,
      "480p": 60,
      "360p": 50,
      "240p": 40,
      Auto: 30,
      Unknown: 0
    };
    var SERVER_SCORE = {
      VOE: 10,
      Filemoon: 10,
      Tplayer: 10,
      Vimeos: 10,
      Netu: 5,
      GoodStream: 10,
      StreamWish: -5,
      VidHide: -5,
      Supervideo: 10
    };
    function sortStreamsByQuality(streams) {
      if (!Array.isArray(streams))
        return [];
      return [...streams].sort((a, b) => {
        const scoreA = QUALITY_SCORE[a.quality] || 0;
        const scoreB = QUALITY_SCORE[b.quality] || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        const serverA = (a.serverLabel || "").split(" ")[0];
        const serverB = (b.serverLabel || "").split(" ")[0];
        const speedA = SERVER_SCORE[serverA] || 0;
        const speedB = SERVER_SCORE[serverB] || 0;
        if (speedA !== speedB) {
          return speedB - speedA;
        }
        if (a.verified && !b.verified)
          return -1;
        if (!a.verified && b.verified)
          return 1;
        return 0;
      });
    }
    module2.exports = { sortStreamsByQuality };
  }
});

// src/utils/mirrors.js
var require_mirrors = __commonJS({
  "src/utils/mirrors.js"(exports2, module2) {
    var MIRRORS = {
      VIDHIDE: [
        "vidhide",
        "minochinos",
        "vadisov",
        "vaiditv",
        "amusemre",
        "callistanise",
        "vhaudm",
        "mdfury",
        "dintezuvio",
        "acek-cdn",
        "vedonm",
        "vidhidepro",
        "vidhidevip",
        "supervideo",
        "masukestin",
        "vidoza"
      ],
      STREAMWISH: [
        "hlswish",
        "streamwish",
        "hglink",
        "hglamioz",
        "hglink.to",
        "audinifer",
        "embedwish",
        "awish",
        "dwish",
        "strwish",
        "filelions",
        "wishembed",
        "wishfast",
        "hanerix"
      ],
      FILEMOON: [
        "filemoon",
        "moonalu",
        "moonembed",
        "bysedikamoum",
        "r66nv9ed",
        "398fitus",
        "filemoon.sx",
        "filemoon.to",
        "filemoon.lat",
        "filemoon.live",
        "filemoon.online",
        "filemoon.me",
        "bysedikamoum.com",
        "r66nv9ed.com",
        "398fitus.com",
        "fmoon.top"
      ],
      VOE: ["voe.sx", "voe-sx", "voex.sx", "marissashare", "cloudwindow", "marissasharecareer"],
      FASTREAM: ["fastream", "fastplay", "fembed"],
      OKRU: ["ok.ru", "okru"],
      PIXELDRAIN: ["pixeldrain"],
      BUZZHEAVIER: ["buzzheavier", "bzh.sh"],
      GOODSTREAM: ["goodstream", "gs.one"],
      LULUSTREAM: ["lulustream", "luluvdo", "luluvids", "pondy", "lulupuv", "luluvid"],
      SEEKSTREAMING: ["seekplays", "seekstreaming", "embedseek"],
      DROPCDN: ["dropcdn.io", "dropload.io", "dropcdn", "dropload", "dr0pstream"],
      DOODSTREAM: [
        "dood.li",
        "dood.la",
        "ds2video.com",
        "ds2play.com",
        "dood.yt",
        "dood.ws",
        "dood.so",
        "dood.to",
        "dood.pm",
        "dood.watch",
        "dood.sh",
        "dood.cx",
        "dood.wf",
        "dood.re",
        "dood.one",
        "dood.tech",
        "dood.work",
        "dooods.pro",
        "dooood.com",
        "doodstream.com",
        "doodstream.co",
        "d000d.com",
        "d0000d.com",
        "doodapi.com",
        "d0o0d.com",
        "do0od.com",
        "dooodster.com",
        "vidply.com",
        "do7go.com",
        "all3do.com",
        "doply.net",
        "dsvplay.com"
      ],
      VIDNEST: ["vidnest.io", "vidnest.live"],
      VIDSONIC: ["vidsonic.net"],
      BARMONREY: ["barmonrey.com"],
      VIDMOLY: ["vidmoly.biz", "vidmoly.to"],
      UNLIMPLAY: ["unlimplay.com"],
      KRAKENFILES: ["krakenfiles.com"],
      UPNS: ["upns.online", "upns.pro", "pelisplus.upns.pro"]
    };
    function isMirror2(url, groupName) {
      if (!url || !MIRRORS[groupName])
        return false;
      const s = url.toLowerCase();
      return MIRRORS[groupName].some((m) => s.includes(m));
    }
    module2.exports = { MIRRORS, isMirror: isMirror2 };
  }
});

// src/utils/engine.js
var require_engine = __commonJS({
  "src/utils/engine.js"(exports2, module2) {
    var { validateStream: validateStream2 } = require_m3u8();
    var { sortStreamsByQuality } = require_sorting();
    var { isMirror: isMirror2 } = require_mirrors();
    function normalizeLanguage(lang) {
      const l = (lang || "").toLowerCase();
      if (l === "latino" || l === "espa\xF1ol" || l === "lat" || l === "auto") {
        return "Latino";
      }
      if (l.includes("lat") || l.includes("mex") || l.includes("col") || l.includes("arg") || l.includes("chi") || l.includes("per") || l.includes("dub") || l.includes("dual")) {
        return "Latino";
      }
      if (l.includes("esp") || l.includes("cas") || l.includes("spa") || l.includes("cast") || l === "esp") {
        return "Castellano";
      }
      if (l.includes("sub") || l.includes("vose") || l === "sub") {
        return "Subtitulado";
      }
      if (l.includes("eng") || l.includes("en-us") || l === "en") {
        return "Ingl\xE9s";
      }
      return lang || "Latino";
    }
    function normalizeServer(server, url = "", resolvedServerName = null) {
      if (resolvedServerName)
        return resolvedServerName;
      const u = (url || "").toLowerCase();
      const s = (server || "").toLowerCase();
      if (u.includes("goodstream") || s.includes("goodstream"))
        return "GoodStream";
      if (isMirror2(u, "FASTREAM") || isMirror2(s, "FASTREAM"))
        return "Fastream";
      if (isMirror2(u, "DROPCDN") || isMirror2(s, "DROPCDN"))
        return "DropCDN";
      if (u.includes("vimeos") || u.includes("vms.sh") || s.includes("vimeos"))
        return "Vimeos";
      if (isMirror2(u, "VIDHIDE") || isMirror2(s, "VIDHIDE"))
        return "VidHide";
      if (isMirror2(u, "STREAMWISH") || isMirror2(s, "STREAMWISH"))
        return "StreamWish";
      if (isMirror2(u, "VOE") || isMirror2(s, "VOE"))
        return "VOE";
      if (isMirror2(u, "FILEMOON") || isMirror2(s, "FILEMOON"))
        return "Filemoon";
      if (url && url.includes("supervideo"))
        return "Supervideo";
      if (isMirror2(u, "DOODSTREAM") || isMirror2(s, "DOODSTREAM"))
        return "DoodStream";
      if (url) {
        try {
          const domainParts = new URL(url).hostname.replace("www.", "").split(".");
          const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
          return mainName.charAt(0).toUpperCase() + mainName.slice(1);
        } catch (e) {
        }
      }
      return server || "Servidor";
    }
    function finalizeStreams2(streams, providerName) {
      return __async(this, null, function* () {
        if (!Array.isArray(streams) || streams.length === 0)
          return [];
        console.log(`[Engine] PROCESANDO STREAMS - Bitrate Global v7.6.0`);
        const sorted = sortStreamsByQuality(streams);
        const CONCURRENCY_LIMIT = 5;
        const MAX_VALIDATIONS = 3;
        const validatedStreams = [];
        for (let i = 0; i < sorted.length; i += CONCURRENCY_LIMIT) {
          if (i >= MAX_VALIDATIONS) {
            validatedStreams.push(...sorted.slice(i));
            break;
          }
          const batch = sorted.slice(i, i + CONCURRENCY_LIMIT);
          const batchResults = yield Promise.all(
            batch.map((s) => __async(this, null, function* () {
              try {
                if (s.isReal === true || s.verified === true)
                  return s;
                if (s.url && (s.url.includes(".m3u8") || s.url.includes(".mp4"))) {
                  const hasAbort = typeof AbortController !== "undefined";
                  const controller = hasAbort ? new AbortController() : null;
                  let timeoutId;
                  if (hasAbort) {
                    timeoutId = setTimeout(() => controller.abort(), 5e3);
                  }
                  try {
                    let validated;
                    if (hasAbort) {
                      validated = yield validateStream2(s, controller.signal);
                    } else {
                      validated = yield Promise.race([
                        validateStream2(s, null),
                        new Promise((_, reject) => {
                          timeoutId = setTimeout(() => reject(new Error("timeout")), 5e3);
                        })
                      ]);
                    }
                    clearTimeout(timeoutId);
                    return validated;
                  } catch (e) {
                    clearTimeout(timeoutId);
                    return __spreadProps(__spreadValues({}, s), { verified: false, isReal: false });
                  }
                }
              } catch (e) {
              }
              return s;
            }))
          );
          validatedStreams.push(...batchResults);
        }
        const processed = [];
        const seenTitles = /* @__PURE__ */ new Set();
        for (const s of validatedStreams) {
          if (!s)
            continue;
          if (s.verified === false)
            continue;
          const rawLang = normalizeLanguage(
            s.lang || s.Audio || s.langLabel || s.language || s.audio || "Latino"
          );
          const l = rawLang.toLowerCase();
          const isLatino = l.includes("latino") || l.includes("castellano");
          if (!isLatino && providerName !== "FuegoCine")
            continue;
          const server = normalizeServer(
            s.serverLabel || s.serverName || s.servername,
            s.url,
            s.serverName
          );
          const quality = s.quality || "HD";
          const isReal = s.isReal === true;
          const isVerified = s.verified === true;
          const checkMark = isReal ? " \u2705" : "";
          const streamName = `${providerName} - ${quality}${checkMark}`;
          const streamTitle = `${rawLang} - ${server}`;
          if (seenTitles.has(streamName + streamTitle + s.url))
            continue;
          seenTitles.add(streamName + streamTitle + s.url);
          processed.push({
            name: streamName,
            title: streamTitle,
            url: s.url,
            quality,
            verified: isVerified,
            isReal,
            provider: server,
            language: rawLang,
            headers: s.headers || {
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
        }
        return processed;
      });
    }
    module2.exports = { finalizeStreams: finalizeStreams2, normalizeLanguage };
  }
});

// src/utils/tmdb.js
var require_tmdb = __commonJS({
  "src/utils/tmdb.js"(exports2, module2) {
    var { fetchJson: fetchJson2 } = require_http();
    var TMDB_API_KEY = [
      "439c478a771f35c05022f9feabcca01c",
      "d131017ccc6e5462a81c9304d21476de",
      "1c29a5198ee1854bd5eb45dbe8d17d92"
    ][Math.floor(Math.random() * 3)];
    var titleCache = /* @__PURE__ */ new Map();
    var idCache = /* @__PURE__ */ new Map();
    function getTmdbTitle(tmdbId, mediaType, retries = 2) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        const cacheKey = `${mediaType}_${tmdbId}`;
        if (titleCache.has(cacheKey))
          return titleCache.get(cacheKey);
        if (retries < 2)
          yield new Promise((r) => setTimeout(r, 1e3));
        const isImdb = tmdbId && tmdbId.startsWith("tt");
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const fetchUrl = isImdb ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id` : `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
          const data = yield fetchJson2(fetchUrl);
          const title = isImdb ? ((_b = (_a = data[type + "_results"]) == null ? void 0 : _a[0]) == null ? void 0 : _b.title) || ((_d = (_c = data[type + "_results"]) == null ? void 0 : _c[0]) == null ? void 0 : _d.name) : data.title || data.name;
          const result = title || null;
          titleCache.set(cacheKey, result);
          return result;
        } catch (e) {
          if (retries > 0)
            return getTmdbTitle(tmdbId, mediaType, retries - 1);
          titleCache.set(cacheKey, null);
          return null;
        }
      });
    }
    function getTmdbInfo2(tmdbId, mediaType, lang, retries = 2) {
      return __async(this, null, function* () {
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${lang || "es-MX"}`;
          const data = yield fetchJson2(url);
          return {
            title: data.title || data.name,
            originalTitle: data.original_title || data.original_name || null,
            year: (data.release_date || data.first_air_date || "").split("-")[0],
            genres: (data.genres || []).map((g) => g.id),
            originCountries: data.origin_country || (data.production_countries || []).map((c) => c.iso_3166_1) || []
          };
        } catch (e) {
          if (retries > 0) {
            yield new Promise((r) => setTimeout(r, 1e3));
            return getTmdbInfo2(tmdbId, mediaType, lang, retries - 1);
          }
          return null;
        }
      });
    }
    function getCorrectImdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return { imdbId: null, title: "" };
        const cacheKey = `${mediaType}_${tmdbId}`;
        if (idCache.has(cacheKey))
          return idCache.get(cacheKey);
        if (tmdbId.startsWith("tt")) {
          const res = { imdbId: tmdbId, title: "Contenido", offset: 0, fromMapping: false };
          idCache.set(cacheKey, res);
          return res;
        }
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const idUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
          const idRes = yield fetchJson2(idUrl);
          if (!idRes || !idRes.imdb_id) {
            const result2 = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
            idCache.set(cacheKey, result2);
            return result2;
          }
          const metaRes = yield getTmdbInfo2(tmdbId, mediaType);
          const result = {
            imdbId: idRes.imdb_id,
            title: (metaRes == null ? void 0 : metaRes.title) || "Contenido",
            year: (metaRes == null ? void 0 : metaRes.year) || null,
            offset: 0,
            fromMapping: false
          };
          idCache.set(cacheKey, result);
          return result;
        } catch (e) {
          const result = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
          idCache.set(cacheKey, result);
          return result;
        }
      });
    }
    function getTmdbAliases2(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const titleEs = yield getTmdbTitle(tmdbId, mediaType);
          const titleEn = yield (() => __async(this, null, function* () {
            try {
              const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
              const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
              const data = yield fetchJson2(url);
              return data.title || data.name || null;
            } catch (e) {
              return null;
            }
          }))();
          const aliases = [];
          if (titleEs)
            aliases.push(titleEs);
          if (titleEn && titleEn !== titleEs)
            aliases.push(titleEn);
          try {
            const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
            const altUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`;
            const altData = yield fetchJson2(altUrl);
            const titles = altData.titles || altData.results || [];
            for (const t of titles) {
              const altTitle = t.title || t.name;
              if (altTitle && !aliases.includes(altTitle))
                aliases.push(altTitle);
            }
          } catch (e) {
            console.warn(`[TMDB-Aliases] Alternative titles fetch failed`);
          }
          return aliases;
        } catch (e) {
          return [];
        }
      });
    }
    module2.exports = { getTmdbTitle, getTmdbInfo: getTmdbInfo2, getCorrectImdbId, getTmdbAliases: getTmdbAliases2, TMDB_API_KEY };
  }
});

// src/utils/aes_gcm.js
var require_aes_gcm = __commonJS({
  "src/utils/aes_gcm.js"(exports2, module2) {
    var _CryptoJS = typeof CryptoJS !== "undefined" ? CryptoJS : null;
    function parseB64(b64) {
      if (!b64 || !_CryptoJS)
        return null;
      try {
        const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
        return _CryptoJS.enc.Base64.parse(normalized);
      } catch (e) {
        return null;
      }
    }
    function decryptGCM(keyWA, ivWA, ciphertextWithTagWA) {
      try {
        if (!keyWA || !ivWA || !ciphertextWithTagWA || !_CryptoJS)
          return null;
        const tagSizeWords = 4;
        const ciphertextWords = ciphertextWithTagWA.words.slice(
          0,
          ciphertextWithTagWA.words.length - tagSizeWords
        );
        const ciphertextWA = _CryptoJS.lib.WordArray.create(
          ciphertextWords,
          ciphertextWithTagWA.sigBytes - 16
        );
        let counterWA = ivWA.clone();
        counterWA.concat(_CryptoJS.lib.WordArray.create([2], 4));
        const decrypted = _CryptoJS.AES.decrypt({ ciphertext: ciphertextWA }, keyWA, {
          iv: counterWA,
          mode: _CryptoJS.mode.CTR,
          padding: _CryptoJS.pad.NoPadding
        });
        return decrypted.toString(_CryptoJS.enc.Utf8);
      } catch (e) {
        console.error("[AES-GCM] Error:", e.message);
        return null;
      }
    }
    function decryptByse(playback) {
      try {
        if (!playback || !playback.key_parts || !playback.payload || !playback.iv || !_CryptoJS)
          return null;
        let keyWA = parseB64(playback.key_parts[0]);
        for (let i = 1; i < playback.key_parts.length; i++) {
          const part = parseB64(playback.key_parts[i]);
          if (part)
            keyWA.concat(part);
        }
        const ivWA = parseB64(playback.iv);
        const ciphertextWithTagWA = parseB64(playback.payload);
        return decryptGCM(keyWA, ivWA, ciphertextWithTagWA);
      } catch (e) {
        console.error("[Byse] Failed:", e.message);
        return null;
      }
    }
    module2.exports = { decryptByse };
  }
});

// src/hackstore2/extractor.js
var import_http = __toESM(require_http());
var import_m3u8 = __toESM(require_m3u8());
var import_engine = __toESM(require_engine());
var import_mirrors = __toESM(require_mirrors());
var import_tmdb = __toESM(require_tmdb());
var BASE_URL = "https://hackstore.mx";
function localAtob(input) {
  if (!input)
    return "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = String(input).replace(/=+$/, "").replace(/[\s\n\r\t]/g, "");
  let output = "";
  if (str.length % 4 === 1)
    return "";
  for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}
function resolveVoe(url, signal = null) {
  return __async(this, null, function* () {
    try {
      const currentUA = (0, import_http.getSessionUA)();
      console.log(`[HackStore2-VOE] Resolving: ${url}`);
      const response = yield fetch(url, { headers: { "User-Agent": currentUA }, signal });
      if (!response.ok)
        return null;
      const html = yield response.text();
      if (html.includes("window.location.href") && html.length < 2e3) {
        const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
        if (rm)
          return resolveVoe(rm[1], signal);
      }
      const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          let encText = Array.isArray(parsed) ? parsed[0] : parsed;
          if (typeof encText !== "string")
            return null;
          let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const limit = c <= "Z" ? 90 : 122;
            const shifted = code + 13;
            return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
          });
          const noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
          for (const n of noise)
            decoded = decoded.split(n).join("");
          const b64_1 = localAtob(decoded);
          if (!b64_1)
            throw new Error("LocalAtob failed stage 1");
          let shiftedStr = "";
          for (let j = 0; j < b64_1.length; j++) {
            shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
          }
          const reversed = shiftedStr.split("").reverse().join("");
          const decrypted = localAtob(reversed);
          if (!decrypted)
            throw new Error("LocalAtob failed stage 2");
          const data = JSON.parse(decrypted);
          if (data && data.source) {
            const reqHeaders = { "User-Agent": currentUA, Referer: url };
            const validation = yield (0, import_m3u8.validateStream)(
              { url: data.source, headers: reqHeaders },
              signal
            );
            return {
              url: data.source,
              quality: (validation == null ? void 0 : validation.quality) || "1080p",
              verified: (validation == null ? void 0 : validation.verified) || true,
              isReal: (validation == null ? void 0 : validation.isReal) || false,
              serverName: "VOE",
              headers: reqHeaders
            };
          }
        } catch (ex) {
          console.error(`[HackStore2-VOE] Decryption failed: ${ex.message}`);
        }
      }
      const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
      if (m3u8Match) {
        const reqHeaders = { Referer: url, "User-Agent": currentUA };
        return { url: m3u8Match[1], quality: "1080p", serverName: "VOE", headers: reqHeaders };
      }
      return null;
    } catch (error) {
      console.error(`[HackStore2-VOE] Error: ${error.message}`);
      return null;
    }
  });
}
function resolveStreamWish(url, signal = null) {
  return __async(this, null, function* () {
    try {
      const UA = (0, import_http.getSessionUA)();
      const rawId = url.split("/").pop().replace(/\.html$/, "");
      const mirrors = [
        `https://hanerix.com/e/${rawId}`,
        `https://embedwish.com/e/${rawId}`,
        `https://hglink.to/e/${rawId}`,
        url,
        `https://streamwish.to/e/${rawId}`,
        `https://awish.pro/e/${rawId}`,
        `https://strwish.com/e/${rawId}`
      ];
      console.log(`[HackStore2-StreamWish] Race-Resolving: ${rawId}`);
      const validResult = yield new Promise((resolveRace) => {
        let resolved = false;
        let pending = mirrors.length;
        mirrors.forEach((mirror) => __async(this, null, function* () {
          try {
            const mirrorObj = new URL(mirror);
            const mirrorOrigin = mirrorObj.origin;
            const resp = yield fetch(mirror, {
              headers: { Referer: mirror, "User-Agent": UA },
              signal
            });
            if (!resp.ok)
              throw new Error();
            const html = yield resp.text();
            let m3u8Url = null;
            const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
            if (fileMatch)
              m3u8Url = fileMatch[1];
            if (m3u8Url && !resolved) {
              resolved = true;
              m3u8Url = m3u8Url.replace(/\\/g, "");
              if (m3u8Url.startsWith("/"))
                m3u8Url = mirrorOrigin + m3u8Url;
              resolveRace({ url: m3u8Url, mirror });
            }
          } catch (e) {
          } finally {
            pending--;
            if (pending === 0 && !resolved)
              resolveRace(null);
          }
        }));
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolveRace(null);
          }
        }, 3500);
      });
      if (!validResult)
        return null;
      const reqHeaders = {
        Referer: validResult.mirror,
        Origin: new URL(validResult.mirror).origin,
        "User-Agent": UA
      };
      return { url: validResult.url, quality: "Auto", serverName: "StreamWish", headers: reqHeaders };
    } catch (e) {
      return null;
    }
  });
}
function unpackVidHide(script) {
  try {
    const match = script.match(
      /eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
    );
    if (!match)
      return null;
    let [, p, a, , k] = match;
    a = parseInt(a);
    k = k.split("|");
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    const decode = (l, s) => {
      let res = "";
      while (l > 0) {
        res = chars[l % s] + res;
        l = Math.floor(l / s);
      }
      return res || "0";
    };
    return p.replace(/\b\w+\b/g, (l) => {
      const s = parseInt(l, 36);
      return s < k.length && k[s] ? k[s] : decode(s, a);
    });
  } catch (e) {
    return null;
  }
}
function resolveVidHide(url, signal = null) {
  return __async(this, null, function* () {
    try {
      const currentUA = (0, import_http.getSessionUA)();
      console.log(`[HackStore2-VidHide] Resolving: ${url}`);
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const response = yield fetch(url, {
        signal,
        headers: { "User-Agent": currentUA, Referer: `https://${domain}/` }
      });
      if (!response.ok)
        return null;
      const html = yield response.text();
      let finalUrl = null;
      let quality = "1080p";
      const packedMatch = html.match(
        /eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/
      );
      if (packedMatch) {
        const unpacked = unpackVidHide(packedMatch[0]);
        if (unpacked) {
          const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
          if (hlsMatch)
            finalUrl = hlsMatch[1];
          const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i);
          if (labelMatch)
            quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
        }
      }
      if (!finalUrl) {
        const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i);
        if (rawMatch)
          finalUrl = rawMatch[1];
      }
      if (!finalUrl)
        return null;
      if (!finalUrl.startsWith("http"))
        finalUrl = new URL(url).origin + finalUrl;
      const reqHeaders = __spreadProps(__spreadValues({}, (0, import_http.getStealthHeaders)()), {
        Referer: url.split("?")[0],
        Origin: new URL(url).origin,
        "User-Agent": currentUA
      });
      return { url: finalUrl, quality, serverName: "VidHide", headers: reqHeaders };
    } catch (e) {
      return null;
    }
  });
}
function resolveFilemoon(url, signal = null) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d;
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
      if (!videoId)
        return null;
      const UA_CHROME = (0, import_http.getSessionUA)();
      console.log(`[HackStore2-Filemoon] Resolving: ${videoId}`);
      try {
        const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
        const response = yield fetch(playbackUrl, {
          signal,
          headers: { "User-Agent": UA_CHROME, Referer: url, Origin: `https://${hostname}` }
        });
        if (response.ok) {
          const playbackData = yield response.json();
          if (playbackData && playbackData.playback) {
            const { decryptByse } = yield Promise.resolve().then(() => __toESM(require_aes_gcm()));
            const decrypted = decryptByse(playbackData.playback);
            if (decrypted) {
              const data = decrypted.includes("{") ? JSON.parse(decrypted) : null;
              const directUrl = ((_b = (_a = data == null ? void 0 : data.sources) == null ? void 0 : _a[0]) == null ? void 0 : _b.url) || (data == null ? void 0 : data.url);
              if (directUrl) {
                return {
                  url: directUrl,
                  quality: ((_d = (_c = data == null ? void 0 : data.sources) == null ? void 0 : _c[0]) == null ? void 0 : _d.label) || "1080p",
                  verified: true,
                  serverName: "Filemoon",
                  headers: {
                    "User-Agent": UA_CHROME,
                    Referer: `https://${hostname}/`,
                    Origin: `https://${hostname}`
                  }
                };
              }
            }
          }
        }
      } catch (err) {
        console.log(`[HackStore2-Filemoon] Shield Fallback: ${err.message}`);
      }
      return null;
    } catch (e) {
      return null;
    }
  });
}
function resolveEmbed(url, hint = "") {
  return __async(this, null, function* () {
    const s = url.toLowerCase();
    const serverHint = (hint || "").toLowerCase();
    if (serverHint.includes("voe") || s.includes("voe"))
      return yield resolveVoe(url);
    if (serverHint.includes("wish") || s.includes("streamwish") || s.includes("filelions"))
      return yield resolveStreamWish(url);
    if (serverHint.includes("vidhide") || s.includes("vidhide"))
      return yield resolveVidHide(url);
    if (serverHint.includes("filemoon") || s.includes("filemoon"))
      return yield resolveFilemoon(url);
    if ((0, import_mirrors.isMirror)(s, "VOE"))
      return yield resolveVoe(url);
    if ((0, import_mirrors.isMirror)(s, "STREAMWISH"))
      return yield resolveStreamWish(url);
    if ((0, import_mirrors.isMirror)(s, "FILEMOON"))
      return yield resolveFilemoon(url);
    if ((0, import_mirrors.isMirror)(s, "VIDHIDE"))
      return yield resolveVidHide(url);
    return { url, quality: "HD", verified: false };
  });
}
function normalizeSlug(title) {
  if (!title)
    return "";
  return title.toLowerCase().replace(/[áàäâ]/g, "a").replace(/[éèëê]/g, "e").replace(/[íìïî]/g, "i").replace(/[óòöô]/g, "o").replace(/[úùüû]/g, "u").replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function extractStreams(tmdbId, mediaType, season, episode, title) {
  return __async(this, null, function* () {
    if (!tmdbId)
      return [];
    console.log(`[HackStore2] API Fast-Track: ${title || tmdbId} (TMDB: ${tmdbId})`);
    try {
      const [info, aliases] = yield Promise.all([
        (0, import_tmdb.getTmdbInfo)(tmdbId, mediaType),
        (0, import_tmdb.getTmdbAliases)(tmdbId, mediaType)
      ]);
      const year = (info == null ? void 0 : info.year) || "";
      const baseTitles = /* @__PURE__ */ new Set();
      if (title)
        baseTitles.add(title);
      if (info == null ? void 0 : info.title)
        baseTitles.add(info.title);
      if (aliases)
        aliases.forEach((a) => baseTitles.add(a));
      const slugsToTry = [];
      for (const t of baseTitles) {
        const sl = normalizeSlug(t);
        if (!sl)
          continue;
        if (year)
          slugsToTry.push(`${sl}-${year}`);
        slugsToTry.push(sl);
      }
      const uniqueSlugs = [...new Set(slugsToTry)].slice(0, 6);
      console.log(`[HackStore2] Slug Storm:`, uniqueSlugs);
      let targetId = null;
      const postType = mediaType === "movie" || mediaType === "movies" ? "movies" : "tvshows";
      const idResults = yield Promise.all(
        uniqueSlugs.map((slug) => __async(this, null, function* () {
          const endpoint = `${BASE_URL}/wp-api/v1/single/${postType}?slug=${slug}&postType=${postType}`;
          try {
            const res = yield (0, import_http.fetchJson)(endpoint);
            if (res && res.data && res.data._id) {
              return { slug, id: res.data._id };
            }
          } catch (e) {
          }
          return null;
        }))
      );
      const match = idResults.find((r) => r !== null);
      if (match) {
        targetId = match.id;
        console.log(`[HackStore2] Match! Slug: ${match.slug} -> ID: ${targetId}`);
      }
      if (!targetId) {
        console.log("[HackStore2] ID not found.");
        return [];
      }
      if (postType === "tvshows") {
        console.log(`[HackStore2] Episode S${season}E${episode}...`);
        const epListUrl = `${BASE_URL}/wp-api/v1/single/episodes/list?_id=${targetId}&season=${season}&page=1&postsPerPage=200`;
        const epRes = yield (0, import_http.fetchJson)(epListUrl);
        if (epRes && epRes.data && epRes.data.posts) {
          const epObj = epRes.data.posts.find(
            (p) => p.season_number == season && p.episode_number == episode
          );
          if (epObj && epObj._id) {
            targetId = epObj._id;
          } else {
            return [];
          }
        } else {
          return [];
        }
      }
      const playerResponse = yield (0, import_http.fetchJson)(`${BASE_URL}/wp-api/v1/player?postId=${targetId}`);
      if (!playerResponse || !playerResponse.data || !playerResponse.data.embeds)
        return [];
      const playerData = playerResponse.data.embeds.slice(0, 15);
      const streamPromises = playerData.map((p) => __async(this, null, function* () {
        const lang = (p.lang || "Latino").toLowerCase();
        if (lang.includes("sub") || lang.includes("vose") || lang.includes("eng") || lang.includes("espana"))
          return null;
        const rawUrl = p.url;
        if (!rawUrl || rawUrl.includes("la.movie"))
          return null;
        try {
          const resolved = yield resolveEmbed(rawUrl);
          if (!resolved || !resolved.url)
            return null;
          return {
            url: resolved.url,
            quality: resolved.quality || "HD",
            verified: resolved.verified || false,
            langLabel: "Latino",
            serverName: resolved.serverName || p.server || "Online",
            headers: resolved.headers || {}
          };
        } catch (e) {
          return null;
        }
      }));
      const candidates = (yield Promise.all(streamPromises)).filter(Boolean);
      return yield (0, import_engine.finalizeStreams)(candidates, "HackStore2", title || "");
    } catch (error) {
      console.error(`[HackStore2] Fatal Error:`, error.message);
      return [];
    }
  });
}

// src/hackstore2/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      return yield extractStreams(tmdbId, mediaType, season, episode);
    } catch (e) {
      console.error(`[HackStore2] Error: ${e.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
