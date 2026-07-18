/**
 * cineby - Built from src/cineby/
 * Generated: 2026-07-18T20:23:06.005Z
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
    var DEFAULT_TIMEOUT = 8e3;
    function getCinebyHeaders() {
      return {
        Accept: "*/*",
        Origin: "https://cineby.sc",
        Referer: "https://cineby.sc/",
        "User-Agent": getSessionUA()
      };
    }
    var sessionUA = null;
    function setSessionUA(ua) {
      sessionUA = ua;
    }
    function getSessionUA() {
      return sessionUA || DEFAULT_CHROME_UA;
    }
    function getStealthHeaders() {
      return {
        "User-Agent": getSessionUA(),
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
    var DEFAULT_UA = getSessionUA();
    var MOBILE_UA = getSessionUA();
    function request(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        const opt = options || {};
        const currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA();
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
            console.log(`[HTTP] Redirecci\xF3n detectada (Manual): ${redirectUrl}`);
            return { status: response.status, redirectUrl, ok: false };
          }
          if (!response.ok && !opt.ignoreErrors) {
            console.warn("[HTTP] Error " + response.status + " en " + url);
          }
          return response;
        } catch (error) {
          console.error("[HTTP] Error en " + url + ": " + error.message);
          throw error;
        }
      });
    }
    function fetchHtml2(url, options) {
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const result = yield request(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
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
      fetchHtml: fetchHtml2,
      fetchJson: fetchJson2,
      fetchWithTimeout,
      getSessionUA,
      setSessionUA,
      getStealthHeaders,
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
    var { getSessionUA } = require_http();
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
    function validateStream(stream, signal = null) {
      return __async(this, null, function* () {
        if (!stream || !stream.url)
          return stream;
        const { url, headers } = stream;
        const isMp4 = url.toLowerCase().includes(".mp4");
        if (VALIDATION_CACHE.has(url))
          return __spreadValues(__spreadValues({}, stream), VALIDATION_CACHE.get(url));
        try {
          const fetchOptions = {
            method: isMp4 ? "HEAD" : "GET",
            headers: __spreadValues({
              "User-Agent": getSessionUA()
            }, headers || {})
          };
          if (signal)
            fetchOptions.signal = signal;
          const response = yield fetch(url, fetchOptions);
          if (!response.ok)
            return __spreadProps(__spreadValues({}, stream), { verified: false });
          if (isMp4) {
            const resultData2 = { verified: true, quality: stream.quality || "1080p", isReal: true };
            VALIDATION_CACHE.set(url, resultData2);
            return __spreadValues(__spreadValues({}, stream), resultData2);
          }
          const text = yield response.text();
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
    module2.exports = { validateStream, getQualityFromHeight };
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
    function isMirror(url, groupName) {
      if (!url || !MIRRORS[groupName])
        return false;
      const s = url.toLowerCase();
      return MIRRORS[groupName].some((m) => s.includes(m));
    }
    module2.exports = { MIRRORS, isMirror };
  }
});

// src/utils/engine.js
var require_engine = __commonJS({
  "src/utils/engine.js"(exports2, module2) {
    var { validateStream } = require_m3u8();
    var { sortStreamsByQuality } = require_sorting();
    var { isMirror } = require_mirrors();
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
      if (isMirror(u, "FASTREAM") || isMirror(s, "FASTREAM"))
        return "Fastream";
      if (isMirror(u, "DROPCDN") || isMirror(s, "DROPCDN"))
        return "DropCDN";
      if (u.includes("vimeos") || u.includes("vms.sh") || s.includes("vimeos"))
        return "Vimeos";
      if (isMirror(u, "VIDHIDE") || isMirror(s, "VIDHIDE"))
        return "VidHide";
      if (isMirror(u, "STREAMWISH") || isMirror(s, "STREAMWISH"))
        return "StreamWish";
      if (isMirror(u, "VOE") || isMirror(s, "VOE"))
        return "VOE";
      if (isMirror(u, "FILEMOON") || isMirror(s, "FILEMOON"))
        return "Filemoon";
      if (url && url.includes("supervideo"))
        return "Supervideo";
      if (isMirror(u, "DOODSTREAM") || isMirror(s, "DOODSTREAM"))
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
        const MAX_VALIDATIONS = 5;
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
                if (s.isReal === true)
                  return s;
                if (s.url && (s.url.includes(".m3u8") || s.url.includes(".mp4"))) {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 2500);
                  try {
                    const validated = yield validateStream(s, controller.signal);
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
    function getTmdbTitle2(tmdbId, mediaType, retries = 2) {
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
            return getTmdbTitle2(tmdbId, mediaType, retries - 1);
          titleCache.set(cacheKey, null);
          return null;
        }
      });
    }
    function getTmdbInfo(tmdbId, mediaType, lang, retries = 2) {
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
            return getTmdbInfo(tmdbId, mediaType, lang, retries - 1);
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
          const metaRes = yield getTmdbInfo(tmdbId, mediaType);
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
    function getTmdbAliases(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const titleEs = yield getTmdbTitle2(tmdbId, mediaType);
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
    module2.exports = { getTmdbTitle: getTmdbTitle2, getTmdbInfo, getCorrectImdbId, getTmdbAliases, TMDB_API_KEY };
  }
});

// src/utils/helpers.js
var require_helpers = __commonJS({
  "src/utils/helpers.js"(exports2, module2) {
    function sleep2(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function padEpisode(episode) {
      return String(episode).padStart(2, "0");
    }
    function isMovie(mediaType) {
      return mediaType === "movie" || mediaType === "movies";
    }
    function cleanTmdbId2(tmdbId) {
      return tmdbId ? tmdbId.toString().split(":")[0] : tmdbId;
    }
    function toDoubleBase64(str) {
      try {
        if (typeof btoa !== "undefined")
          return btoa(str);
      } catch (e) {
      }
      try {
        if (typeof Buffer !== "undefined")
          return Buffer.from(str, "utf-8").toString("base64");
      } catch (e) {
      }
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128)
          bytes.push(c);
        else if (c < 2048)
          bytes.push(192 | c >> 6, 128 | c & 63);
        else if (c < 55296 || c >= 57344)
          bytes.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
        else {
          i++;
          const cp = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
          bytes.push(
            240 | cp >> 18,
            128 | cp >> 12 & 63,
            128 | cp >> 6 & 63,
            128 | cp & 63
          );
        }
      }
      const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let r = "";
      for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
        if (b1 === void 0)
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4] + "==";
        else if (b2 === void 0)
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4 | b1 >> 4] + b64[(b1 & 15) << 2] + "=";
        else
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4 | b1 >> 4] + b64[(b1 & 15) << 2 | b2 >> 6] + b64[b2 & 63];
      }
      return r;
    }
    function b64decode(str) {
      try {
        if (typeof atob !== "undefined")
          return atob(str);
      } catch (e) {
      }
      try {
        if (typeof Buffer !== "undefined")
          return Buffer.from(str, "base64").toString("utf8");
      } catch (e) {
      }
      try {
        const s = str.replace(/[\s]/g, "");
        if (s.length % 4 !== 0)
          return null;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        const lookup = {};
        for (let i = 0; i < chars.length; i++)
          lookup[chars[i]] = i;
        let r = "";
        for (let i = 0; i < s.length; i += 4) {
          const c0 = lookup[s[i]], c1 = lookup[s[i + 1]], c2 = lookup[s[i + 2]], c3 = lookup[s[i + 3]];
          if (c0 === void 0 || c1 === void 0 || c2 === void 0 || c3 === void 0)
            return null;
          r += String.fromCharCode(c0 << 2 | c1 >> 4);
          if (c2 !== 64) {
            r += String.fromCharCode((c1 & 15) << 4 | c2 >> 2);
            if (c3 !== 64)
              r += String.fromCharCode((c2 & 3) << 6 | c3);
          }
        }
        return r;
      } catch (e) {
        return null;
      }
    }
    module2.exports = { sleep: sleep2, padEpisode, isMovie, cleanTmdbId: cleanTmdbId2, toDoubleBase64, b64decode };
  }
});

// src/cineby/extractor.js
var import_http = __toESM(require_http());
var import_engine = __toESM(require_engine());
var import_tmdb = __toESM(require_tmdb());
var import_helpers = __toESM(require_helpers());

// src/cineby/streamcrypto.js
var _MASK = 4294967295;
var _GOLDEN = 2654435769;
var _MAGIC = [109, 118, 109, 49];
function _imul(a, b) {
  return Math.imul(a, b) >>> 0;
}
function _f(e) {
  e = e >>> 0;
  e ^= e >>> 16;
  e = _imul(e, 2246822507);
  e ^= e >>> 13;
  e = _imul(e, 3266489909);
  e ^= e >>> 16;
  return e >>> 0;
}
function _rotl(e, t) {
  e = e >>> 0;
  t = t & 31;
  if (t === 0)
    return e;
  return (e << t | e >>> 32 - t) >>> 0;
}
function _fnv_f(text) {
  let t = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    t = _imul(t ^ text.charCodeAt(i), 16777619);
  }
  return _f(t);
}
function _key_schedule(seed, media_id) {
  const n = _f(_fnv_f(seed) ^ _f(media_id & _MASK ^ _GOLDEN)) >>> 0;
  const state = {};
  let currentN = n;
  for (let e = 0; e < 8; e++) {
    const idx = currentN % 61;
    currentN = _rotl(currentN + _GOLDEN >>> 0, 7 + (e & 7));
    state[idx] = (currentN ^ _f(currentN)) >>> 0;
    currentN = _f(currentN + idx >>> 0);
  }
  const acc = _f((2779096485 ^ currentN) >>> 0);
  return { state, acc };
}
function _keystream(seed, media_id, length) {
  const { state, acc: initialAcc } = _key_schedule(seed, media_id);
  const stateCopy = {};
  for (const k in state)
    stateCopy[k] = state[k];
  let acc = initialAcc;
  const out = [];
  let pos = 0;
  let counter = 0;
  while (pos < length) {
    const a = acc >>> 0;
    const i = a % 61;
    const mask = stateCopy.hasOwnProperty(i) ? _MASK : 0;
    const low = (stateCopy[i] || 0) >>> 0;
    const n = (low ^ _imul(_GOLDEN, counter + 1)) >>> 0;
    let c = (a ^ n | a & n & mask) >>> 0;
    c = (_rotl(c + a >>> 0, i & 31) ^ _rotl(a, _imul(i, 7) & 31)) >>> 0;
    acc = _f(c + _GOLDEN >>> 0);
    stateCopy[i] = acc >>> 0;
    counter++;
    const val = acc >>> 0;
    out[pos] = val & 255;
    pos++;
    if (pos < length) {
      out[pos] = val >> 8 & 255;
      pos++;
    }
    if (pos < length) {
      out[pos] = val >> 16 & 255;
      pos++;
    }
    if (pos < length) {
      out[pos] = val >> 24 & 255;
      pos++;
    }
  }
  return out;
}
function _b64_decode(text) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const map = {};
  for (let i = 0; i < 64; i++)
    map[chars[i]] = i;
  const out = [];
  for (let i = 0; i < text.length; i += 4) {
    const c1 = map[text[i]];
    const c2 = map[text[i + 1]];
    const c3 = map[text[i + 2]];
    const c4 = map[text[i + 3]];
    if (c1 === void 0 || c2 === void 0)
      break;
    out.push(c1 << 2 | c2 >> 4);
    if (c3 !== void 0) {
      out.push((c2 & 15) << 4 | c3 >> 2);
      if (c4 !== void 0)
        out.push((c3 & 3) << 6 | c4);
    }
  }
  return out;
}
function _b64url_decode(text) {
  text = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (text.length % 4 !== 0)
    text += "=";
  return _b64_decode(text);
}
function _utf8_decode(bytes) {
  let str = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 128) {
      str += String.fromCharCode(b);
      i++;
    } else if (b < 224) {
      const b2 = bytes[i + 1];
      str += String.fromCharCode((b & 31) << 6 | b2 & 63);
      i += 2;
    } else if (b < 240) {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      str += String.fromCharCode((b & 15) << 12 | (b2 & 63) << 6 | b3 & 63);
      i += 3;
    } else {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      const b4 = bytes[i + 3];
      const cp = (b & 7) << 18 | (b2 & 63) << 12 | (b3 & 63) << 6 | b4 & 63;
      str += String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
      i += 4;
    }
  }
  return str;
}
function decryptSources(encrypted, seed, mediaId) {
  const data = _b64url_decode(encrypted);
  const ks = _keystream(seed, parseInt(mediaId), data.length);
  for (let i = 0; i < data.length; i++) {
    data[i] ^= ks[i];
  }
  for (let i = 0; i < 4; i++) {
    if (data[i] !== _MAGIC[i]) {
      throw new Error("STREAMCRYPTO: bad seed or tampered payload");
    }
  }
  return JSON.parse(_utf8_decode(data.slice(4)));
}

// src/cineby/extractor.js
var API_BASE = "https://api.wingsdatabase.com";
var VIDKING_BASE = "https://www.vidking.net";
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var HEADERS = {
  "User-Agent": UA,
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": VIDKING_BASE,
  "Referer": VIDKING_BASE + "/"
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function tryApiPath(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const numericId = parseInt((0, import_helpers.cleanTmdbId)(tmdbId));
    const isMovie = mediaType === "movie";
    const s = season !== void 0 && season !== null ? parseInt(season) : 0;
    const e = episode !== void 0 && episode !== null ? parseInt(episode) : 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const seedUrl = `${API_BASE}/seed?mediaId=${numericId}`;
        const seedData = yield (0, import_http.fetchJson)(seedUrl, { headers: HEADERS });
        const seed = seedData.seed;
        if (!seed) {
          console.log(`[Cineby] No seed in response`);
          continue;
        }
        const mediaTypeParam = isMovie ? "movie" : "tv";
        const sourcesUrl = `${API_BASE}/cdn/sources-with-title?tmdbId=${numericId}&mediaType=${mediaTypeParam}&seasonId=${s}&episodeId=${e}&enc=2&seed=${seed}`;
        const encryptedData = yield (0, import_http.fetchJson)(sourcesUrl, { headers: HEADERS });
        if (typeof encryptedData === "string" && encryptedData.length > 0) {
          const decrypted = decryptSources(encryptedData, seed, numericId);
          if (decrypted && decrypted.sources && decrypted.sources.length > 0) {
            return decrypted.sources.map((src) => ({
              url: src.url,
              quality: src.quality || "1080p",
              headers: { Referer: VIDKING_BASE + "/", "User-Agent": UA }
            }));
          }
        }
      } catch (e2) {
        console.log(`[Cineby] API attempt ${attempt + 1} failed: ${e2.message}`);
        if (attempt < 2)
          yield sleep(1e3);
      }
    }
    return null;
  });
}
function tryEmbedFallback(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const numericId = parseInt((0, import_helpers.cleanTmdbId)(tmdbId));
      let embedUrl;
      if (mediaType === "movie" || !season && !episode) {
        embedUrl = `${VIDKING_BASE}/embed/movie/${numericId}`;
      } else {
        const s = parseInt(season) || 1;
        const e = parseInt(episode) || 1;
        embedUrl = `${VIDKING_BASE}/embed/tv/${numericId}/${s}/${e}`;
      }
      const html = yield (0, import_http.fetchHtml)(embedUrl, { headers: HEADERS });
      const m3u8Regex = /https?:\/\/[^"'\s]*\.m3u8[^"'\s]*/gi;
      const matches = html.match(m3u8Regex);
      if (matches && matches.length > 0) {
        return matches.map((url) => ({
          url,
          quality: "1080p",
          headers: { Referer: VIDKING_BASE + "/", "User-Agent": UA }
        }));
      }
    } catch (e) {
      console.log(`[Cineby] Embed fallback failed: ${e.message}`);
    }
    return null;
  });
}
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    if (!tmdbId)
      return [];
    console.log(`[Cineby] Looking for content: ${tmdbId} (${mediaType})`);
    try {
      const title = yield (0, import_tmdb.getTmdbTitle)((0, import_helpers.cleanTmdbId)(tmdbId), mediaType);
      if (!title) {
        console.log(`[Cineby] No title found for ${tmdbId}`);
        return [];
      }
      console.log(`[Cineby] Trying API path...`);
      let sources = yield tryApiPath(tmdbId, mediaType, season, episode);
      if (!sources) {
        console.log(`[Cineby] API failed, trying embed fallback...`);
        sources = yield tryEmbedFallback(tmdbId, mediaType, season, episode);
      }
      if (!sources || sources.length === 0) {
        console.log(`[Cineby] No sources found`);
        return [];
      }
      const rawStreams = sources.map((s) => ({
        url: s.url,
        quality: s.quality,
        serverLabel: "VidKing",
        language: "Latino",
        headers: s.headers || { "User-Agent": UA, Referer: VIDKING_BASE + "/" }
      }));
      return yield (0, import_engine.finalizeStreams)(rawStreams, "Cineby", title);
    } catch (error) {
      console.error(`[Cineby] Error: ${error.message}`);
      return [];
    }
  });
}

// src/cineby/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      return yield extractStreams(tmdbId, mediaType, season, episode);
    } catch (e) {
      console.error(`[Cineby] Error: ${e.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
