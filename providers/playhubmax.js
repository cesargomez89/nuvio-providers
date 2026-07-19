/**
 * playhubmax - Built from src/playhubmax/
 * Generated: 2026-07-19T04:18:31.425Z
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
    function getStealthHeaders() {
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
    function validateStream(stream, signal = null) {
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
                      validated = yield validateStream(s, controller.signal);
                    } else {
                      validated = yield Promise.race([
                        validateStream(s, null),
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

// src/resolvers/voe.js
var require_voe = __commonJS({
  "src/resolvers/voe.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var { validateStream } = require_m3u8();
    var VOE_MIRRORS = ["voe.sx", "voe-sx", "voex.sx"];
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
    function tryResolve(url, signal) {
      return __async(this, null, function* () {
        const currentUA = getSessionUA2();
        console.log(`[VOE] TV-Resolving: ${url}`);
        const response = yield fetch(url, {
          headers: { "User-Agent": currentUA },
          signal
        });
        if (!response.ok)
          return null;
        const html = yield response.text();
        if (html.includes("window.location.href") && html.length < 2e3) {
          const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
          if (rm)
            return tryResolve(rm[1], signal);
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
              console.log(`[VOE] Success: ${data.source.substring(0, 50)}...`);
              const reqHeaders = { "User-Agent": currentUA, Referer: url };
              const streamObj = { url: data.source, headers: reqHeaders };
              const validation = yield validateStream(streamObj, signal);
              const isLive = validation ? validation.verified : true;
              const streamQuality = validation && validation.quality ? validation.quality : "1080p";
              return {
                url: data.source,
                quality: streamQuality,
                verified: isLive,
                isReal: validation ? validation.isReal : false,
                serverName: "VOE",
                headers: reqHeaders
              };
            }
          } catch (ex) {
            console.error(`[VOE] Decryption failed: ${ex.message}`);
          }
        }
        const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
        if (m3u8Match) {
          const fallbackUrl = m3u8Match[1];
          const reqHeaders = { Referer: url, "User-Agent": currentUA };
          const streamObj = { url: fallbackUrl, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          return {
            url: fallbackUrl,
            quality: (validation == null ? void 0 : validation.quality) || "1080p",
            verified: validation ? validation.verified : true,
            isReal: validation ? validation.isReal : false,
            serverName: "VOE",
            headers: reqHeaders
          };
        }
        return null;
      });
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        let result = yield tryResolve(url, signal);
        if (result)
          return result;
        for (const mirror of VOE_MIRRORS) {
          if (url.includes(mirror))
            continue;
          const mirrorUrl = url.replace(/voe\.sx|voe-sx|voex\.sx/, mirror);
          result = yield tryResolve(mirrorUrl, signal);
          if (result)
            return result;
        }
        return null;
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/hlswish.js
var require_hlswish = __commonJS({
  "src/resolvers/hlswish.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var { validateStream } = require_m3u8();
    function unpackEval(payload, radix, symtab) {
      const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const unbase = (str) => {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
          const pos = chars.indexOf(str[i]);
          if (pos === -1)
            return NaN;
          result = result * radix + pos;
        }
        return result;
      };
      return payload.replace(/\b([0-9a-zA-Z]+)\b/g, (match) => {
        const idx = unbase(match);
        if (isNaN(idx) || idx >= symtab.length)
          return match;
        return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
      });
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const rawId = url.split("/").pop().replace(/\.html$/, "");
          const mirrors = [
            `https://hanerix.com/e/${rawId}`,
            `https://embedwish.com/e/${rawId}`,
            `https://hglink.to/e/${rawId}`,
            url,
            `https://streamwish.to/e/${rawId}`,
            `https://awish.pro/e/${rawId}`,
            `https://strwish.com/e/${rawId}`,
            `https://wishfast.top/e/${rawId}`,
            `https://sfastwish.com/e/${rawId}`
          ];
          console.log(`[StreamWish] Race-Resolving v7.9.4: ${rawId} (${mirrors.length} mirrors)`);
          const validResult = yield new Promise((resolveRace) => {
            let resolved = false;
            let pending = mirrors.length;
            mirrors.forEach((mirror) => __async(this, null, function* () {
              try {
                const mirrorObj = new URL(mirror);
                const mirrorOrigin = mirrorObj.origin;
                const resp = yield fetch(mirror, {
                  headers: { Referer: mirror, "User-Agent": UA2 },
                  signal
                });
                if (!resp.ok)
                  throw new Error();
                const html = yield resp.text();
                let m3u8Url = null;
                const hashMatch = html.match(/[0-9a-f]{32}/i);
                if (hashMatch) {
                  const hash = hashMatch[0];
                  const dlUrl = `${mirrorOrigin}/dl?op=view&file_code=${rawId}&hash=${hash}&embed=1&referer=&adb=1&hls4=1`;
                  const dlResp = yield fetch(dlUrl, {
                    headers: { "User-Agent": UA2, Referer: mirror, "X-Requested-With": "XMLHttpRequest" },
                    signal
                  });
                  if (dlResp.ok) {
                    const dlData = yield dlResp.text();
                    const match = dlData.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const packedMatch = html.match(
                    /eval\(function\(p,a,c,k,e,[a-z]\)\{[\s\S]*?\}\s*\('([\s\S]+?)',\s*(\d+),\s*(\d+),\s*'([\s\S]+?)'\.split\('\|'\)/
                  );
                  if (packedMatch) {
                    const unpacked = unpackEval(
                      packedMatch[1],
                      parseInt(packedMatch[2]),
                      packedMatch[4].split("|")
                    );
                    const match = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
                  if (fileMatch)
                    m3u8Url = fileMatch[1];
                }
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
            "User-Agent": UA2
          };
          const streamObj = { url: validResult.url, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : "Auto";
          return {
            url: validResult.url,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "StreamWish",
            headers: reqHeaders
          };
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
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

// src/resolvers/filemoon.js
var require_filemoon = __commonJS({
  "src/resolvers/filemoon.js"(exports2, module2) {
    var { decryptByse } = require_aes_gcm();
    var { getSessionUA: getSessionUA2 } = require_http();
    var UA_CHROME = getSessionUA2();
    function unpack(p, a, c, k) {
      while (c--)
        if (k[c])
          p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
      return p;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
          if (!videoId)
            return null;
          console.log(`[Filemoon] TV-Resolving: ${videoId} Host: ${hostname}`);
          try {
            const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
            const response = yield fetch(playbackUrl, {
              signal,
              headers: {
                "User-Agent": UA_CHROME,
                Referer: url,
                Origin: `https://${hostname}`,
                "X-Embed-Parent": url
              }
            });
            if (response.ok) {
              const playbackData = yield response.json();
              if (playbackData && playbackData.playback) {
                const decrypted = decryptByse(playbackData.playback);
                if (decrypted) {
                  const data = decrypted.includes("{") ? JSON.parse(decrypted) : null;
                  const directUrl = ((_b = (_a = data == null ? void 0 : data.sources) == null ? void 0 : _a[0]) == null ? void 0 : _b.url) || (data == null ? void 0 : data.url);
                  if (directUrl) {
                    try {
                      const vCheck = yield fetch(directUrl, {
                        method: "HEAD",
                        headers: { "User-Agent": UA_CHROME }
                      });
                      if (vCheck.status === 404) {
                        console.log("[Filemoon] \u274C URL de video caducada (404).");
                        return null;
                      }
                    } catch (e) {
                    }
                    return {
                      url: directUrl,
                      quality: ((_d = (_c = data == null ? void 0 : data.sources) == null ? void 0 : _c[0]) == null ? void 0 : _d.label) || "1080p",
                      verified: true,
                      serverName: "Filemoon",
                      headers: {
                        "User-Agent": UA_CHROME,
                        Referer: `https://${hostname}/`,
                        Origin: `https://${hostname}`,
                        "x-embed-origin": "ww3.gnulahd.nu"
                      }
                    };
                  }
                }
              }
            }
          } catch (e) {
            console.log(`[Filemoon] Shield Fall\xF3: ${e.message}`);
          }
          const resp = yield fetch(url, { headers: { "User-Agent": UA_CHROME, Referer: urlObj.origin } });
          const html1 = yield resp.text();
          const evalMatch = html1.match(
            /eval\(function\(p,a,c,k,e,(?:d|\w+)\)\{[\s\S]+?\}\s*\(([\s\S]+?)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]+?)'\.split/
          );
          if (evalMatch) {
            const unpacked = unpack(
              evalMatch[1],
              parseInt(evalMatch[2]),
              parseInt(evalMatch[3]),
              evalMatch[4].split("|"),
              0,
              {}
            );
            const m3u8Match = unpacked.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/i);
            if (m3u8Match) {
              return {
                url: m3u8Match[1],
                verified: true,
                serverName: "Filemoon",
                headers: {
                  "User-Agent": UA_CHROME,
                  Referer: `https://${hostname}`,
                  Origin: `https://${hostname}`
                }
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`[Filemoon] Error: ${error.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidhide.js
var require_vidhide = __commonJS({
  "src/resolvers/vidhide.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2, getStealthHeaders } = require_http();
    var { validateStream } = require_m3u8();
    function unpackVidHide(script) {
      try {
        const match = script.match(
          /eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
        );
        if (!match)
          return null;
        let [, p, a, c, k] = match;
        a = parseInt(a);
        parseInt(c);
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
        const unpacked = p.replace(/\b\w+\b/g, (l) => {
          const s = parseInt(l, 36);
          return s < k.length && k[s] ? k[s] : decode(s, a);
        });
        return unpacked;
      } catch (e) {
        return null;
      }
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const currentUA = getSessionUA2();
          console.log(`[VidHide] TV-Resolving: ${url}`);
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          const response = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": currentUA,
              Referer: `https://${domain}/`
            }
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
              const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i) || unpacked.match(/name\s*:\s*"([^"]+)"/i);
              if (labelMatch)
                quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
            }
          }
          if (!finalUrl) {
            const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i) || html.match(/["'](https?:\/\/[^"']+?\/stream\/[^"']+?\.m3u8[^"']*?)["']/i);
            if (rawMatch)
              finalUrl = rawMatch[1];
          }
          if (!finalUrl)
            return null;
          if (!finalUrl.startsWith("http"))
            finalUrl = new URL(url).origin + finalUrl;
          if (!finalUrl.includes("referer="))
            finalUrl += (finalUrl.includes("?") ? "&" : "?") + "referer=embed69.org";
          const reqHeaders = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            Referer: url.split("?")[0],
            Origin: new URL(url).origin,
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": currentUA
          });
          const streamObj = { url: finalUrl, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : quality;
          return {
            url: finalUrl,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "VidHide",
            headers: reqHeaders
          };
        } catch (e) {
          console.error(`[VidHide] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/doodstream.js
var require_doodstream = __commonJS({
  "src/resolvers/doodstream.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var RAND_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    function randomStr(len) {
      let r = "";
      for (let i = 0; i < len; i++)
        r += RAND_CHARS.charAt(Math.floor(Math.random() * RAND_CHARS.length));
      return r;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const urlObj = new URL(url);
          const domain = urlObj.origin;
          const pathMatch = urlObj.pathname.match(/\/[ed]\/([a-z0-9]+)/i);
          if (!pathMatch)
            return null;
          const videoId = pathMatch[1];
          const embedUrl = `${domain}/e/${videoId}`;
          const resp = yield fetch(embedUrl, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: embedUrl,
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          if (html.includes("Video not found")) {
            console.log("[DoodStream] Video not found");
            return null;
          }
          const passMatch = html.match(/\/pass_md5\/[^'"]+/);
          if (!passMatch)
            return null;
          const tokenMatch = html.match(/[?&]token=([a-z0-9]+)[&'"]/i);
          if (!tokenMatch)
            return null;
          const token = tokenMatch[1];
          const passUrl = `${domain}${passMatch[0]}`;
          const passResp = yield fetch(passUrl, {
            signal,
            headers: { "User-Agent": UA2, Referer: embedUrl }
          });
          if (!passResp.ok)
            return null;
          const baseUrl = (yield passResp.text()).trim();
          if (!baseUrl || baseUrl.length < 10)
            return null;
          const expiry = Date.now() * 1e3;
          const finalUrl = `${baseUrl}${randomStr(10)}?token=${token}&expiry=${expiry}`;
          return {
            url: finalUrl,
            quality: "1080p",
            serverName: "DoodStream",
            headers: {
              "User-Agent": UA2,
              Referer: domain,
              Origin: domain
            }
          };
        } catch (e) {
          console.error(`[DoodStream] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/packer.js
var require_packer = __commonJS({
  "src/utils/packer.js"(exports2, module2) {
    function unpackPacker(html) {
      const match = html.match(
        /eval\(function\(p,a,c,k,e,d\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
      );
      if (!match)
        return null;
      let [, p, a, c, k] = match;
      a = parseInt(a);
      c = parseInt(c);
      k = k.split("|");
      while (c--) {
        if (k[c])
          p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
      }
      return p;
    }
    module2.exports = { unpackPacker };
  }
});

// src/resolvers/dropcdn.js
var require_dropcdn = __commonJS({
  "src/resolvers/dropcdn.js"(exports2, module2) {
    var { unpackPacker } = require_packer();
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain,
              Accept: "text/html,application/xhtml+xml",
              "Accept-Language": "es-US,es;q=0.9"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          if (html.includes("expired") || html.includes("deleted") || html.includes("not found")) {
            console.log(`[DropCDN] File expired or deleted at ${url}`);
            return null;
          }
          const unpacked = unpackPacker(html);
          if (!unpacked) {
            const directMatch = html.match(/file:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (!directMatch)
              return null;
            return {
              url: directMatch[1],
              quality: "1080p",
              serverName: "DropCDN",
              headers: {
                "User-Agent": UA2,
                Referer: domain,
                Origin: domain
              }
            };
          }
          const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (!fileMatch)
            return null;
          return {
            url: fileMatch[1],
            quality: "1080p",
            serverName: "DropCDN",
            headers: {
              "User-Agent": UA2,
              Referer: domain,
              Origin: domain
            }
          };
        } catch (e) {
          console.error(`[DropCDN] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/quality.js
var require_quality = __commonJS({
  "src/resolvers/quality.js"(exports2, module2) {
    var { request, getSessionUA: getSessionUA2 } = require_http();
    function detectQuality(_0) {
      return __async(this, arguments, function* (url, headers = {}) {
        try {
          if (!url || !url.includes(".m3u8"))
            return "1080p";
          const res = yield request(url, {
            timeout: 5e3,
            headers: __spreadValues({
              "User-Agent": getSessionUA2()
            }, headers)
          });
          const data = yield res.text();
          if (!data.includes("#EXT-X-STREAM-INF")) {
            const match = url.match(/[_-](\d{3,4})p/i);
            return match ? `${match[1]}p` : "1080p";
          }
          let maxRes = 0;
          const lines = data.split("\n");
          for (const line of lines) {
            const match = line.match(/RESOLUTION=\d+x(\d+)/i);
            if (match) {
              const res2 = parseInt(match[1]);
              if (res2 > maxRes)
                maxRes = res2;
            }
          }
          if (maxRes > 0) {
            if (maxRes >= 2160)
              return "4K";
            if (maxRes >= 1080)
              return "1080p";
            if (maxRes >= 720)
              return "720p";
            if (maxRes >= 480)
              return "480p";
            return `${maxRes}p`;
          }
          return "1080p";
        } catch (e) {
          return "1080p";
        }
      });
    }
    module2.exports = { detectQuality };
  }
});

// src/resolvers/goodstream.js
var require_goodstream = __commonJS({
  "src/resolvers/goodstream.js"(exports2, module2) {
    var { detectQuality } = require_quality();
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          console.log(`[GoodStream] Resolviendo: ${embedUrl}`);
          const response = yield fetch(embedUrl, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://goodstream.one/",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-MX,es;q=0.9",
              Connection: "keep-alive"
            }
          });
          const data = yield response.text();
          const match = data.match(/file:\s*"([^"]+)"/);
          if (!match) {
            console.log('[GoodStream] No se encontr\xF3 patr\xF3n file:"..."');
            return null;
          }
          const videoUrl = match[1];
          const refererHeaders = {
            Referer: embedUrl,
            Origin: "https://goodstream.one",
            "User-Agent": UA2,
            "Accept-Language": "es-MX,es;q=0.9"
          };
          const quality = yield detectQuality(videoUrl, refererHeaders);
          console.log(`[GoodStream] URL encontrada (${quality}): ${videoUrl.substring(0, 80)}...`);
          return {
            url: videoUrl,
            quality: quality || "1080p",
            verified: !!quality,
            serverName: "GoodStream",
            headers: refererHeaders
          };
        } catch (err) {
          console.log(`[GoodStream] Error: ${err.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/fastream.js
var require_fastream = __commonJS({
  "src/resolvers/fastream.js"(exports2, module2) {
    var UA2 = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var { unpackPacker } = require_packer();
    function detectQuality(_0) {
      return __async(this, arguments, function* (m3u8Url, headers = {}, signal = null) {
        try {
          const res = yield fetch(m3u8Url, {
            signal,
            headers: __spreadValues({ "User-Agent": UA2 }, headers),
            redirect: "follow"
          });
          const data = yield res.text();
          if (!data.includes("#EXT-X-STREAM-INF")) {
            const match = m3u8Url.match(/[_-](\d{3,4})p/);
            return match ? `${match[1]}p` : "1080p";
          }
          let bestHeight = 0;
          const lines = data.split("\n");
          for (const line of lines) {
            const m = line.match(/RESOLUTION=\d+x(\d+)/);
            if (m) {
              const h = parseInt(m[1]);
              if (h > bestHeight)
                bestHeight = h;
            }
          }
          if (bestHeight >= 2160)
            return "4K";
          if (bestHeight >= 1080)
            return "1080p";
          if (bestHeight >= 720)
            return "720p";
          if (bestHeight >= 480)
            return "480p";
          return bestHeight > 0 ? `${bestHeight}p` : "1080p";
        } catch (e) {
          return "1080p";
        }
      });
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a;
        try {
          const res = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://www3.seriesmetro.net/"
            },
            redirect: "follow"
          });
          const data = yield res.text();
          const unpacked = unpackPacker(data);
          if (!unpacked)
            return null;
          const m3u8 = (_a = unpacked.match(/file:"(https?:\/\/[^"]+\.m3u8[^"]*)"/)) == null ? void 0 : _a[1];
          if (!m3u8)
            return null;
          const quality = yield detectQuality(m3u8, { Referer: "https://www3.seriesmetro.net/" }, signal);
          return {
            url: m3u8,
            quality,
            headers: { "User-Agent": UA2, Referer: "https://www3.seriesmetro.net/" }
          };
        } catch (e) {
          console.error("[Fastream] Error:", e.message);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vimeos.js
var require_vimeos = __commonJS({
  "src/resolvers/vimeos.js"(exports2, module2) {
    var { fetchHtml, fetchJson: fetchJson2, getSessionUA: getSessionUA2 } = require_http();
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        const UA2 = getSessionUA2();
        try {
          console.log("[Vimeos] Resolviendo: " + embedUrl);
          var html = yield fetchHtml(embedUrl, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://vimeos.net/",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8"
            }
          });
          var vimeoIdMatch = html.match(/vimeo\.com\/video\/(\d+)/i);
          if (!vimeoIdMatch)
            vimeoIdMatch = embedUrl.match(/\/(\d{7,10})/);
          if (vimeoIdMatch) {
            var vimeoId = vimeoIdMatch[1];
            try {
              var config = yield fetchJson2("https://player.vimeo.com/video/" + vimeoId + "/config", {
                signal,
                headers: { "User-Agent": UA2, Referer: embedUrl }
              });
              var hlsUrl = null;
              if (config && config.request && config.request.files && config.request.files.hls && config.request.files.hls.cdns && config.request.files.hls.cdns.default) {
                hlsUrl = config.request.files.hls.cdns.default.url;
              }
              if (hlsUrl) {
                return {
                  url: hlsUrl,
                  verified: true,
                  serverName: "Vimeos",
                  headers: {
                    "User-Agent": UA2,
                    Referer: "https://player.vimeo.com/",
                    "Accept-Language": "es-MX,es;q=0.9"
                  }
                };
              }
              var progressive = config && config.request && config.request.files ? config.request.files.progressive : null;
              if (progressive && progressive.length > 0) {
                var best = progressive.sort(function(a, b) {
                  return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
                })[0];
                return {
                  url: best.url,
                  quality: best.quality ? best.quality + "p" : "1080p",
                  serverName: "Vimeos",
                  headers: {
                    "User-Agent": UA2,
                    Referer: "https://player.vimeo.com/",
                    "Accept-Language": "es-MX,es;q=0.9"
                  }
                };
              }
            } catch (e) {
            }
          }
          var packMatch = html.match(
            /eval\(function\(p,a,c,k,e,[dr]\)\{[\s\S]+?\}\('([\s\S]+?)',(\d+),(\d+),'([\s\S]+?)'\.split\('\|'\)/
          );
          if (packMatch) {
            console.log("[Vimeos] Usando Unpacker...");
            var payload = packMatch[1];
            var radix = parseInt(packMatch[2]);
            var symtab = packMatch[4].split("|");
            var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var unbase = function(str) {
              var result = 0;
              for (var i = 0; i < str.length; i++)
                result = result * radix + chars.indexOf(str[i]);
              return result;
            };
            var unpacked = payload.replace(/\b(\w+)\b/g, function(match) {
              var idx = unbase(match);
              return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
            });
            var m3u8Match = unpacked.match(/["']([^"']+\.m3u8[^"']*)['"]/i);
            if (m3u8Match) {
              return {
                url: m3u8Match[1],
                verified: true,
                serverName: "Vimeos",
                headers: { "User-Agent": UA2, Referer: embedUrl }
              };
            }
          }
          return null;
        } catch (e) {
          console.error("[Vimeos] Error:", e.message);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/supervideo.js
var require_supervideo = __commonJS({
  "src/resolvers/supervideo.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2, getStealthHeaders } = require_http();
    var { unpackPacker } = require_packer();
    var { validateStream } = require_m3u8();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        try {
          const UA2 = getSessionUA2();
          console.log(`[Supervideo] Resolving: ${url}`);
          const resp = yield fetch(url, {
            signal,
            headers: __spreadProps(__spreadValues({}, getStealthHeaders()), {
              Referer: new URL(url).origin + "/",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7"
            })
          });
          if (!resp.ok) {
            console.log(`[Supervideo] HTTP ${resp.status}: headers insufficient`);
            return null;
          }
          const html = yield resp.text();
          const unpacked = unpackPacker(html);
          if (!unpacked) {
            const directFile = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (directFile) {
              const streamUrl2 = directFile[1];
              const headers2 = __spreadProps(__spreadValues({}, getStealthHeaders()), {
                Referer: url.split("?")[0],
                Origin: new URL(url).origin,
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": UA2
              });
              const streamObj2 = { url: streamUrl2, headers: headers2 };
              const validation2 = yield validateStream(streamObj2, signal);
              return {
                url: streamUrl2,
                quality: (validation2 == null ? void 0 : validation2.quality) || "1080p",
                verified: (_a = validation2 == null ? void 0 : validation2.verified) != null ? _a : true,
                isReal: (_b = validation2 == null ? void 0 : validation2.isReal) != null ? _b : false,
                serverName: "Supervideo",
                headers: headers2
              };
            }
            return null;
          }
          const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+?\.m3u8[^"']*)["']/i);
          if (!fileMatch)
            return null;
          const streamUrl = fileMatch[1];
          const headers = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            Referer: url.split("?")[0],
            Origin: new URL(url).origin,
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": UA2
          });
          const streamObj = { url: streamUrl, headers };
          const validation = yield validateStream(streamObj, signal);
          return {
            url: streamUrl,
            quality: (validation == null ? void 0 : validation.quality) || "1080p",
            verified: (_c = validation == null ? void 0 : validation.verified) != null ? _c : true,
            isReal: (_d = validation == null ? void 0 : validation.isReal) != null ? _d : false,
            serverName: "Supervideo",
            headers
          };
        } catch (e) {
          console.error(`[Supervideo] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/pixeldrain.js
var require_pixeldrain = __commonJS({
  "src/resolvers/pixeldrain.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const pathMatch = url.match(/pixeldrain\.com\/u\/([a-zA-Z0-9]+)/i);
          if (!pathMatch)
            return null;
          const fileId = pathMatch[1];
          const directUrl = `https://pixeldrain.com/api/file/${fileId}`;
          return {
            url: directUrl,
            quality: "1080p",
            serverName: "Pixeldrain",
            headers: {
              "User-Agent": UA2,
              Referer: "https://pixeldrain.com/",
              Origin: "https://pixeldrain.com"
            }
          };
        } catch (e) {
          console.error(`[Pixeldrain] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/lulustream.js
var require_lulustream = __commonJS({
  "src/resolvers/lulustream.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain,
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "LuluStream",
              headers: {
                "User-Agent": UA2,
                Referer: domain,
                Origin: domain
              }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "LuluStream",
              headers: { "User-Agent": UA2, Referer: domain }
            };
          }
          return null;
        } catch (e) {
          console.error(`[LuluStream] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/okru.js
var require_okru = __commonJS({
  "src/resolvers/okru.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://ok.ru/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const dataSrcMatch = html.match(/data-src\s*=\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (dataSrcMatch) {
            return {
              url: dataSrcMatch[1],
              quality: "1080p",
              serverName: "OKru",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const metaMatch = html.match(/video_url["']\s*:\s*["']([^"']+)["']/i);
          if (metaMatch) {
            return {
              url: metaMatch[1],
              quality: "1080p",
              serverName: "OKru",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const jsonldMatch = html.match(/contentUrl["']\s*:\s*["']([^"']+)["']/i);
          if (jsonldMatch) {
            return {
              url: jsonldMatch[1],
              quality: "1080p",
              serverName: "OKru",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          return null;
        } catch (e) {
          console.error(`[OKru] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/embed69.js
var require_embed69 = __commonJS({
  "src/resolvers/embed69.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://embed69.org/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const dataLinkMatch = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
          if (dataLinkMatch) {
            let decryptLink2 = function(encryptedBase64, key) {
              const raw = CryptoJS2.enc.Base64.parse(encryptedBase64);
              const iv = CryptoJS2.lib.WordArray.create(raw.words.slice(0, 4), 16);
              const ct = CryptoJS2.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
              const decrypted = CryptoJS2.AES.decrypt({ ciphertext: ct }, key, {
                iv,
                mode: CryptoJS2.mode.CBC,
                padding: CryptoJS2.pad.Pkcs7
              });
              return decrypted.toString(CryptoJS2.enc.Utf8);
            };
            var decryptLink = decryptLink2;
            let rawData;
            try {
              rawData = JSON.parse(dataLinkMatch[1].replace(/\\\//g, "/"));
            } catch (e) {
              return null;
            }
            const items = Array.isArray(rawData) ? rawData : Object.values(rawData);
            const CryptoJS2 = require("crypto-js");
            const powChallengeMatch = html.match(/POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/);
            const powDifficultyMatch = html.match(/POW_DIFFICULTY\s*=\s*(\d+)/);
            const powSaltMatch = html.match(/POW_SALT\s*=\s*['"]([^'"]+)['"]/);
            if (!powChallengeMatch || !powDifficultyMatch || !powSaltMatch)
              return null;
            const powChallenge = powChallengeMatch[1];
            const powDifficulty = parseInt(powDifficultyMatch[1]);
            const powSalt = powSaltMatch[1];
            function solvePoW(challenge, difficulty, signal2) {
              return __async(this, null, function* () {
                const prefix = "0".repeat(difficulty);
                let nonce2 = 0;
                const MAX_ITERATIONS = 5e4;
                while (nonce2 < MAX_ITERATIONS) {
                  if (signal2 == null ? void 0 : signal2.aborted)
                    return null;
                  for (let i = 0; i < 100; i++) {
                    const hash = CryptoJS2.SHA256(challenge + nonce2.toString()).toString(CryptoJS2.enc.Hex);
                    if (hash.startsWith(prefix))
                      return nonce2;
                    nonce2++;
                  }
                  yield new Promise((r) => setTimeout(r, 0));
                }
                console.log(`[Embed69] PoW exceeded ${MAX_ITERATIONS} iterations`);
                return null;
              });
            }
            const nonce = yield solvePoW(powChallenge, powDifficulty, signal);
            if (nonce === null)
              return null;
            const aesKey = CryptoJS2.SHA256(powChallenge + nonce.toString() + powSalt);
            for (const item of items) {
              if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds))
                continue;
              for (const embed of item.sortedEmbeds) {
                if (!embed.link)
                  continue;
                const decryptedUrl = decryptLink2(embed.link, aesKey);
                if (!decryptedUrl || !decryptedUrl.startsWith("http"))
                  continue;
                const { resolveEmbed: resolveEmbed2 } = require_resolvers();
                const result = yield resolveEmbed2(decryptedUrl, signal);
                if (result && result.url)
                  return result;
              }
            }
            return null;
          }
          const fileMatch = html.match(/file["']\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Embed69",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          return null;
        } catch (e) {
          console.error(`[Embed69] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/xupalace.js
var require_xupalace = __commonJS({
  "src/resolvers/xupalace.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Xupalace",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          const redirectMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
          if (redirectMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(redirectMatch[1], signal);
          }
          const ogMatch = html.match(/og:video[^>]+content=["']([^"']+)["']/i);
          if (ogMatch) {
            return {
              url: ogMatch[1],
              quality: "1080p",
              serverName: "Xupalace",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Xupalace] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/mixdrop.js
var require_mixdrop = __commonJS({
  "src/resolvers/mixdrop.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function decodeMixdropSource(html) {
      const rcdMatch = html.match(/["']([a-zA-Z0-9]+)["']\s*\+\s*["']([a-zA-Z0-9]+)["']/);
      if (rcdMatch) {
        return rcdMatch[1] + rcdMatch[2];
      }
      const srcMatch = html.match(/src\s*:\s*["']([^"']+)["']/i);
      if (srcMatch)
        return srcMatch[1];
      return null;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://m1xdrop.click/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const videoUrl = decodeMixdropSource(html);
          if (!videoUrl)
            return null;
          return {
            url: videoUrl,
            quality: "1080p",
            serverName: "Mixdrop",
            headers: {
              "User-Agent": UA2,
              Referer: "https://m1xdrop.click/",
              Origin: "https://m1xdrop.click"
            }
          };
        } catch (e) {
          console.error(`[Mixdrop] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/verhdlink.js
var require_verhdlink = __commonJS({
  "src/resolvers/verhdlink.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          if (html.includes("signup") || html.includes("register") || html.includes("login")) {
            console.log(`[Verhdlink] Signup gate detected \u2014 cannot extract video`);
            return null;
          }
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Verhdlink",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "Verhdlink",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Verhdlink] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/streamtape.js
var require_streamtape = __commonJS({
  "src/resolvers/streamtape.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: "https://streamtape.com/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const innerMatch = html.match(/innerHTML\s*=\s*["']([^"']+?)["']/i);
          if (innerMatch) {
            const decoded = innerMatch[1].replace(/\\/g, "");
            const urlMatch = decoded.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i);
            if (urlMatch) {
              return {
                url: urlMatch[1],
                quality: "1080p",
                serverName: "Streamtape",
                headers: { "User-Agent": UA2, Referer: url }
              };
            }
          }
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Streamtape",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          return null;
        } catch (e) {
          console.error(`[Streamtape] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/playhydrax.js
var require_playhydrax = __commonJS({
  "src/resolvers/playhydrax.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "PlayHydrax",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const sourcesMatch = html.match(/sources\s*:\s*\[[^\]]*?file\s*:\s*["']([^"']+)["']/i);
          if (sourcesMatch) {
            return {
              url: sourcesMatch[1],
              quality: "1080p",
              serverName: "PlayHydrax",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[PlayHydrax] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/sololatino.js
var require_sololatino = __commonJS({
  "src/resolvers/sololatino.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Sololatino",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Sololatino] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/krakenfiles.js
var require_krakenfiles = __commonJS({
  "src/resolvers/krakenfiles.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const sourceMatch = html.match(/<source\s+[^>]*src=["']([^"']+)["']/i);
          if (sourceMatch) {
            return {
              url: sourceMatch[1],
              quality: "1080p",
              serverName: "Krakenfiles",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "Krakenfiles",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Krakenfiles] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/unlimplay.js
var require_unlimplay = __commonJS({
  "src/resolvers/unlimplay.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Unlimplay",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "Unlimplay",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Unlimplay] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vibuxer.js
var require_vibuxer = __commonJS({
  "src/resolvers/vibuxer.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Vibuxer",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
          if (iframeMatch) {
            const { resolveEmbed: resolveEmbed2 } = require_resolvers();
            return yield resolveEmbed2(iframeMatch[1], signal);
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "Vibuxer",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          return null;
        } catch (e) {
          console.error(`[Vibuxer] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/emturbovid.js
var require_emturbovid = __commonJS({
  "src/resolvers/emturbovid.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA2,
              Referer: domain + "/",
              Accept: "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const fileMatch = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (fileMatch) {
            return {
              url: fileMatch[1],
              quality: "1080p",
              serverName: "Emturbovid",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          const hashMatch = html.match(/data-hash=["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (hashMatch) {
            return {
              url: hashMatch[1],
              quality: "1080p",
              serverName: "Emturbovid",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const urlPlayMatch = html.match(/urlPlay\s*=\s*['"]([^'"]+\.(?:m3u8|mp4)[^'"]*)['"]/i);
          if (urlPlayMatch) {
            return {
              url: urlPlayMatch[1],
              quality: "1080p",
              serverName: "Emturbovid",
              headers: { "User-Agent": UA2, Referer: url }
            };
          }
          const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
          if (videoMatch) {
            return {
              url: videoMatch[1],
              quality: "1080p",
              serverName: "Emturbovid",
              headers: { "User-Agent": UA2, Referer: domain + "/" }
            };
          }
          if (html.includes("expired") || html.includes("deleted") || html.includes("not found")) {
            console.log(`[Emturbovid] File expired/deleted at ${url}`);
            return null;
          }
          return null;
        } catch (e) {
          console.error(`[Emturbovid] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/buzzheavier.js
var require_buzzheavier = __commonJS({
  "src/resolvers/buzzheavier.js"(exports2, module2) {
    var { getStealthHeaders } = require_http();
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        if (!embedUrl)
          return null;
        try {
          const cleanUrl = embedUrl.split("|")[0].replace(/\/$/, "");
          const domain = new URL(cleanUrl).hostname;
          const downloadUrl = `${cleanUrl}/download`;
          console.log(`[Buzzheavier] Resolviendo: ${cleanUrl}`);
          const headers = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            Referer: cleanUrl,
            "hx-current-url": cleanUrl,
            "hx-request": "true",
            Accept: "*/*"
          });
          try {
            const headResponse = yield fetch(downloadUrl, {
              method: "HEAD",
              headers,
              redirect: "manual",
              signal
            });
            const hxRedirect = headResponse.headers.get("hx-redirect");
            if (hxRedirect) {
              let finalUrl = hxRedirect;
              if (hxRedirect.startsWith("/dl/")) {
                finalUrl = `https://${domain}${hxRedirect}`;
              }
              console.log("[Buzzheavier] Link REAL via hx-redirect.");
              return {
                url: finalUrl + "#.mp4",
                isDirect: true,
                verified: true,
                serverName: "Buzzheavier",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
                  Referer: cleanUrl,
                  "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": '"Windows"',
                  "sec-fetch-dest": "document",
                  "sec-fetch-mode": "navigate",
                  "sec-fetch-site": "cross-site",
                  "upgrade-insecure-requests": "1",
                  priority: "u=0, i"
                }
              };
            }
          } catch (err) {
            console.log(`[Buzzheavier] HEAD fallback: ${err.message}`);
          }
          const id = cleanUrl.split("/").pop();
          const predictableUrl = `https://buzzheavier.com/v/${id}/video.mp4`;
          return {
            url: predictableUrl + "#.mp4",
            isDirect: true,
            verified: true,
            serverName: "Buzzheavier",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
              Referer: cleanUrl,
              "sec-fetch-dest": "document",
              "sec-fetch-mode": "navigate",
              "sec-fetch-site": "cross-site"
            }
          };
        } catch (err) {
          console.error(`[Buzzheavier] Error: ${err.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/tplayer.js
var require_tplayer = __commonJS({
  "src/resolvers/tplayer.js"(exports2, module2) {
    var { getStealthHeaders } = require_http();
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          console.log(`[TPlayer] Resolviendo: ${embedUrl}`);
          const idMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
          if (!idMatch)
            return null;
          const fileId = idMatch[1];
          const baseUrl = new URL(embedUrl).origin;
          const apiUrl = `${baseUrl}/api/resolve/${fileId}`;
          const baseHeaders = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            Referer: embedUrl,
            Origin: baseUrl,
            "X-Requested-With": "XMLHttpRequest"
          });
          const embedResp = yield fetch(embedUrl, { signal, headers: baseHeaders });
          let cookies = "";
          try {
            const raw = embedResp.headers.get("set-cookie");
            if (raw)
              cookies = raw.split(",").map((c) => c.split(";")[0].trim()).join("; ");
          } catch (e) {
          }
          if (cookies)
            baseHeaders["Cookie"] = cookies;
          const apiResp = yield fetch(apiUrl, { signal, headers: baseHeaders });
          if (!apiResp.ok)
            return null;
          const data = yield apiResp.json();
          if (!data || !data.success || !data.streamUrl)
            return null;
          const streamUrl = data.streamUrl.startsWith("http") ? data.streamUrl : `${baseUrl}${data.streamUrl}`;
          return {
            url: streamUrl,
            isDirect: true,
            verified: true,
            serverName: "Tplayer",
            headers: {
              "User-Agent": baseHeaders["User-Agent"],
              Referer: embedUrl,
              Origin: baseUrl,
              Cookie: cookies
            }
          };
        } catch (e) {
          console.error(`[TPlayer] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidsrc.js
var require_vidsrc = __commonJS({
  "src/resolvers/vidsrc.js"(exports2, module2) {
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          let embedUrl = url.toString().replace("vidsrc.to", "vidsrc.xyz").replace("vidsrc.pm", "vidsrc.xyz").replace("moviesapi.club/movie", "cdn.moviesapi.to/embed/movie").replace("moviesapi.to/movie", "cdn.moviesapi.to/embed/movie");
          console.log(`[VidSrc] Resolviendo: ${embedUrl}`);
          const UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
          const headers = { "User-Agent": UA2, Referer: "https://vidsrc.xyz/" };
          const res1 = yield fetch(embedUrl, { headers, signal });
          if (!res1.ok)
            return null;
          const html1 = yield res1.text();
          const iframeMatch = html1.match(/src=['"]([^"]+)['"] f/);
          if (!iframeMatch)
            return null;
          let nextUrl = iframeMatch[1];
          if (nextUrl.startsWith("//"))
            nextUrl = "https:" + nextUrl;
          const res2 = yield fetch(nextUrl, {
            headers: __spreadProps(__spreadValues({}, headers), { Referer: embedUrl }),
            signal
          });
          if (!res2.ok)
            return null;
          const html2 = yield res2.text();
          const encryptedMatch = html2.match(/id="([^"]+)" style="display:none;">([^<]+)/);
          if (!encryptedMatch)
            return null;
          const decId = encryptedMatch[1];
          const cipherText = encryptedMatch[2];
          const decrypted = crsdiv(cipherText, decId);
          if (!decrypted)
            return null;
          const finalUrl = decrypted.split(" ")[0].replace("{v1}", "thrumbleandjaxon.com");
          return {
            url: finalUrl,
            quality: "HD",
            verified: true,
            serverName: "VidSrc",
            headers: {
              "User-Agent": UA2,
              Referer: nextUrl,
              Origin: new URL(nextUrl).origin
            }
          };
        } catch (e) {
          console.error(`[VidSrc] Error: ${e.message}`);
          return null;
        }
      });
    }
    function crsdiv(a, decId) {
      try {
        if (decId === "sXnL9MQIry") {
          const b = Array.from("pWB9V)[*4I`nJpp?ozyB~dbr9yt!_n4u").map((c) => c.charCodeAt(0));
          const d = a.match(/.{2}/g).map((x) => parseInt(x, 16));
          const decrypted = d.map((v, i) => (v ^ b[i % b.length]) - 3);
          return atob(String.fromCharCode(...decrypted));
        }
        if (decId === "IhWrImMIGL") {
          const d = Array.from(a).map((ch) => {
            const code = ch.charCodeAt(0);
            if (code >= 97 && code <= 109 || code >= 65 && code <= 77)
              return String.fromCharCode(code + 13);
            if (code >= 110 && code <= 122 || code >= 78 && code <= 90)
              return String.fromCharCode(code - 13);
            return ch;
          }).join("");
          return atob(d);
        }
        if (decId === "xTyBxQyGTA") {
          const b = a.split("").reverse().join("");
          let c = "";
          for (let i = 0; i < b.length; i += 2)
            c += b[i];
          return atob(c);
        }
        if (["JoAHUMCLXV", "Oi3v1dAlaM", "TsA2KGDGux"].includes(decId)) {
          const shift = { JoAHUMCLXV: 3, Oi3v1dAlaM: 5, TsA2KGDGux: 7 }[decId];
          const b64 = a.split("").reverse().join("").replace(/-/g, "+").replace(/_/g, "/");
          const decoded = atob(b64);
          return Array.from(decoded).map((ch) => String.fromCharCode(ch.charCodeAt(0) - shift)).join("");
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/embedseek.js
var require_embedseek = __commonJS({
  "src/resolvers/embedseek.js"(exports2, module2) {
    var CryptoJS2 = require("crypto-js");
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA2 = getSessionUA2();
          const parsedUrl = new URL(url);
          const hostname = parsedUrl.hostname;
          const hash = parsedUrl.hash;
          const id = hash.replace("#", "").split("&")[0];
          if (!id)
            return null;
          const apiUrl = `${parsedUrl.origin}/api/v1/info?id=${id}`;
          const headers = {
            "User-Agent": UA2,
            Referer: url,
            Origin: parsedUrl.origin
          };
          const response = yield fetch(apiUrl, { headers, signal });
          if (!response.ok)
            return null;
          const encryptedData = yield response.text();
          if (typeof encryptedData !== "string" || encryptedData.length < 10)
            return null;
          const key = generateKey(hostname);
          const iv = generateIV(hostname, hash);
          const decrypted = decrypt(encryptedData, key, iv);
          const data = JSON.parse(decrypted);
          if (data && data.url) {
            let videoUrl = data.url;
            if (videoUrl.startsWith("/")) {
              videoUrl = `${parsedUrl.origin}${videoUrl}`;
            }
            return {
              url: videoUrl,
              verified: true,
              serverName: "SeekStreaming",
              headers: {
                "User-Agent": UA2,
                Referer: url,
                Origin: parsedUrl.origin
              }
            };
          }
          return null;
        } catch (e) {
          console.error("[EmbedSeek] Error:", e.message);
          return null;
        }
      });
    }
    function generateKey(hostname) {
      let n = "";
      const b = "7519".split("");
      for (let i = 0; i < b.length; i++)
        n += String.fromCharCode(parseInt("10" + b[i]));
      n += String.fromCharCode(hostname.charCodeAt(1));
      n += n.substring(1, 3);
      n += String.fromCharCode(110, 109, 117);
      const re = "3579".split("");
      n += String.fromCharCode(parseInt(re[3] + re[2]), parseInt(re[1] + re[2]));
      const s1 = (parseInt(re[0]) + 1).toString() + re[3];
      n += String.fromCharCode(parseInt(s1), parseInt(s1));
      const s2 = (parseInt(re[3]) * 10 + parseInt(re[3])).toString();
      const s3 = re.reverse().join("").substring(0, 2);
      n += String.fromCharCode(parseInt(s2), parseInt(s3));
      return CryptoJS2.enc.Utf8.parse(n.substring(0, 16));
    }
    function generateIV(hostname, hash) {
      const s = hostname;
      const p = s + "//";
      const o = hash;
      const g = s.length * p.length;
      let b = "";
      for (let i = 1; i < 10; i++)
        b += String.fromCharCode(i + g);
      const pe = 3 * o.charCodeAt(0);
      const tt = 111 + s.length;
      const k = tt + 4;
      const ie = s.charCodeAt(1);
      const me = ie - 2;
      b += String.fromCharCode(g, 111, pe, tt, k, ie, me);
      return CryptoJS2.enc.Utf8.parse(b.substring(0, 16));
    }
    function decrypt(hex, keyWA, ivWA) {
      const ciphertextWA = CryptoJS2.enc.Hex.parse(hex);
      const decrypted = CryptoJS2.AES.decrypt({ ciphertext: ciphertextWA }, keyWA, {
        iv: ivWA,
        mode: CryptoJS2.mode.CBC,
        padding: CryptoJS2.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS2.enc.Utf8);
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidnest.js
var require_vidnest = __commonJS({
  "src/resolvers/vidnest.js"(exports2, module2) {
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const response = yield fetch(embedUrl, {
            signal,
            headers: { Referer: "https://www.fuegocine.com/" }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          const match = html.match(/sources\s*:\s*\[\s*\{[^}]*file\s*:\s*"([^"]+\.mp4[^"]*)"/);
          if (match && match[1]) {
            return {
              url: match[1],
              quality: "HD",
              serverName: "VidNest",
              verified: true,
              headers: { Referer: embedUrl }
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidsonic.js
var require_vidsonic = __commonJS({
  "src/resolvers/vidsonic.js"(exports2, module2) {
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const id = embedUrl.split("/").pop().replace(".html", "");
          const targetUrl = `https://vidsonic.net/e/${id}`;
          const response = yield fetch(targetUrl, {
            signal,
            headers: {
              Referer: "https://www.fuegocine.com/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          const vMatch = html.match(/const\s+_0x1\s*=\s*['"]([^'"]+)['"]/);
          if (vMatch) {
            const hexPipe = vMatch[1];
            const clean = hexPipe.split("|").join("");
            let decoded = "";
            for (let i = 0; i < clean.length; i += 2) {
              decoded += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
            }
            const finalUrl = decoded.split("").reverse().join("");
            if (finalUrl.includes("http")) {
              return {
                url: finalUrl,
                quality: "HD",
                serverName: "Vidsonic",
                verified: true,
                headers: { Referer: targetUrl }
              };
            }
          }
          const hexMatch = html.match(/\["([a-f0-9]{50,})"\]/);
          if (hexMatch) {
            const hex = hexMatch[1].split("").reverse().join("");
            let decoded = "";
            for (let i = 0; i < hex.length; i += 2) {
              decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            if (decoded.includes("http")) {
              return {
                url: decoded,
                quality: "HD",
                serverName: "Vidsonic",
                verified: true,
                headers: { Referer: targetUrl }
              };
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/barmonrey.js
var require_barmonrey = __commonJS({
  "src/resolvers/barmonrey.js"(exports2, module2) {
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const response = yield fetch(embedUrl, {
            signal,
            headers: { Referer: "https://www.fuegocine.com/" }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          const m3u8 = html.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
          if (m3u8) {
            return {
              url: m3u8[0],
              quality: "HD",
              serverName: "Barmonrey",
              verified: true,
              headers: { Referer: embedUrl }
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidmoly.js
var require_vidmoly = __commonJS({
  "src/resolvers/vidmoly.js"(exports2, module2) {
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const urlObj = new URL(embedUrl);
          const redirectBase = "https://vidmoly.to";
          const videoId = urlObj.pathname.split("/").pop().replace(".html", "").replace("embed-", "");
          const targetUrl = `${redirectBase}/embed-${videoId}.html`;
          const response = yield fetch(targetUrl, {
            signal,
            headers: {
              Referer: redirectBase + "/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "text/html"
            }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          const match = html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/);
          if (match && match[1]) {
            return {
              url: match[1],
              quality: "HD",
              serverName: "Vidmoly",
              verified: true,
              headers: {
                Referer: targetUrl,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
              }
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/rpmvid.js
var require_rpmvid = __commonJS({
  "src/resolvers/rpmvid.js"(exports2, module2) {
    var CryptoJS2 = require("crypto-js");
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const id = embedUrl.split("/").pop().replace(".html", "");
          const isUpns = embedUrl.includes("upns");
          const apiDomain = isUpns ? "https://fuegocineplayer.upns.online" : "https://rpmvid.com";
          const apiUrl = `${apiDomain}/api/v1/video`;
          const bodyStr = `url=${encodeURIComponent(id)}`;
          const response = yield fetch(apiUrl, {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Referer: embedUrl
            },
            body: bodyStr
          });
          if (!response.ok)
            return null;
          const data = yield response.json();
          if (data.status !== "success" || !data.payload)
            return null;
          const key = CryptoJS2.enc.Utf8.parse("kiemtienmua911ca");
          const iv = CryptoJS2.enc.Utf8.parse("1234567890oiuytr");
          const decrypted = CryptoJS2.AES.decrypt(data.payload, key, {
            iv,
            mode: CryptoJS2.mode.CBC,
            padding: CryptoJS2.pad.Pkcs7
          }).toString(CryptoJS2.enc.Utf8);
          const payload = JSON.parse(decrypted);
          let videoUrl = payload.url || payload.sources && payload.sources[0] && payload.sources[0].file;
          if (videoUrl) {
            if (videoUrl.includes(".txt"))
              videoUrl += "#index.m3u8";
            return {
              url: videoUrl,
              quality: "HD",
              serverName: isUpns ? "UPNS" : "Rpmvid",
              verified: true,
              headers: { Referer: apiDomain }
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/playmogo.js
var require_playmogo = __commonJS({
  "src/resolvers/playmogo.js"(exports2, module2) {
    var { DEFAULT_UA } = require_http();
    function resolve(url) {
      return __async(this, null, function* () {
        try {
          console.log("[Playmogo] Resolving: " + url);
          return {
            url,
            verified: true,
            serverName: "Playmogo",
            headers: {
              "User-Agent": DEFAULT_UA,
              Referer: "https://dsvplay.com/",
              Origin: "https://dsvplay.com"
            }
          };
        } catch (e) {
          console.error("[Playmogo] Error: " + e.message);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/generic_fuegocine.js
var require_generic_fuegocine = __commonJS({
  "src/resolvers/generic_fuegocine.js"(exports2, module2) {
    function resolve(embedUrl, signal = null) {
      return __async(this, null, function* () {
        try {
          const response = yield fetch(embedUrl, {
            signal,
            headers: {
              Referer: "https://www.fuegocine.com/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          const m3u8 = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
          if (m3u8) {
            return {
              url: m3u8[0],
              quality: "HD",
              serverName: "Server",
              verified: true,
              headers: { Referer: embedUrl }
            };
          }
          const mp4 = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
          if (mp4) {
            return {
              url: mp4[0],
              quality: "HD",
              serverName: "Server",
              verified: true,
              headers: { Referer: embedUrl }
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/parallel.js
var require_parallel = __commonJS({
  "src/utils/parallel.js"(exports2, module2) {
    function allSettled(promises) {
      return Promise.all(
        promises.map(
          (p) => p.then((value) => ({ status: "fulfilled", value })).catch((reason) => ({ status: "rejected", reason }))
        )
      );
    }
    function parallelWithLimit(items, handler, limit = 5) {
      return __async(this, null, function* () {
        const results = [];
        for (let i = 0; i < items.length; i += limit) {
          const batch = items.slice(i, i + limit);
          const batchPromises = batch.map((item) => {
            return handler(item).catch(() => null);
          });
          const batchResults = yield allSettled(batchPromises);
          results.push(...batchResults.map((r) => r.status === "fulfilled" ? r.value : null));
        }
        return results;
      });
    }
    function resolveWithLimit(items, handler) {
      return __async(this, null, function* () {
        const results = [];
        const promises = items.map((item) => __async(this, null, function* () {
          return yield handler(item);
        }));
        const settled = yield allSettled(promises);
        settled.forEach((r) => {
          if (r.status === "fulfilled" && r.value)
            results.push(r.value);
        });
        return results;
      });
    }
    function withTimeout(promise, ms = 1e4) {
      return __async(this, null, function* () {
        let timer;
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        });
        try {
          return yield Promise.race([promise, timeout]);
        } finally {
          clearTimeout(timer);
        }
      });
    }
    module2.exports = { allSettled, parallelWithLimit, resolveWithLimit, withTimeout };
  }
});

// src/utils/resolvers.js
var require_resolvers = __commonJS({
  "src/utils/resolvers.js"(exports2, module2) {
    var { resolve: resolveVoe } = require_voe();
    var { resolve: resolveHlswish } = require_hlswish();
    var { resolve: resolveFilemoon } = require_filemoon();
    var { resolve: resolveVidhide } = require_vidhide();
    var { resolve: resolveDoodstream } = require_doodstream();
    var { resolve: resolveDropcdn } = require_dropcdn();
    var { resolve: resolveGoodstream } = require_goodstream();
    var { resolve: resolveFastream } = require_fastream();
    var { resolve: resolveVimeos } = require_vimeos();
    var { resolve: resolveSupervideo } = require_supervideo();
    var { resolve: resolvePixeldrain } = require_pixeldrain();
    var { resolve: resolveLulustream } = require_lulustream();
    var { resolve: resolveOkru } = require_okru();
    var { resolve: resolveEmbed69 } = require_embed69();
    var { resolve: resolveXupalace } = require_xupalace();
    var { resolve: resolveMixdrop } = require_mixdrop();
    var { resolve: resolveVerhdlink } = require_verhdlink();
    var { resolve: resolveStreamtape } = require_streamtape();
    var { resolve: resolvePlayhydrax } = require_playhydrax();
    var { resolve: resolveSololatino } = require_sololatino();
    var { resolve: resolveKrakenfiles } = require_krakenfiles();
    var { resolve: resolveUnlimplay } = require_unlimplay();
    var { resolve: resolveVibuxer } = require_vibuxer();
    var { resolve: resolveEmturbovid } = require_emturbovid();
    var { resolve: resolveBuzzheavier } = require_buzzheavier();
    var { resolve: resolveTplayer } = require_tplayer();
    var { resolve: resolveVidsrc } = require_vidsrc();
    var { resolve: resolveEmbedseek } = require_embedseek();
    var { resolve: resolveVidnest } = require_vidnest();
    var { resolve: resolveVidsonic } = require_vidsonic();
    var { resolve: resolveBarmonrey } = require_barmonrey();
    var { resolve: resolveVidmoly } = require_vidmoly();
    var { resolve: resolveRpmvid } = require_rpmvid();
    var { resolve: resolvePlaymogo } = require_playmogo();
    var { resolve: resolveGeneric } = require_generic_fuegocine();
    var { withTimeout } = require_parallel();
    var { isMirror } = require_mirrors();
    var { getSessionUA: getSessionUA2 } = require_http();
    var UA2 = getSessionUA2();
    var DEAD_DOMAINS = ["supervideo", "mixdrop", "verhdlink", "waaw.to"];
    function getDirectCdnHeaders(url) {
      if (!url)
        return null;
      const { getStealthHeaders } = require_http();
      const s = url.toLowerCase();
      try {
        const domain = new URL(url).hostname;
        const baseOrigin = `https://${domain}`;
        const headers = __spreadProps(__spreadValues({}, getStealthHeaders()), {
          Referer: baseOrigin,
          Origin: baseOrigin
        });
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
        return { "User-Agent": UA2, referer: url.split("?")[0] };
      }
    }
    function applyPiping(result) {
      if (!result || !result.url)
        return result;
      let url = result.url;
      const s = url.toLowerCase();
      const isDirectFile = s.includes("pixeldrain") || s.includes("buzzheavier") || s.includes("tplayer") || result.isDirect;
      const anchor = isDirectFile ? "#.mp4" : "";
      if (anchor && !url.includes(".m3u8") && !url.includes(".mp4")) {
        url = `${url}${anchor}`;
      }
      result.url = url;
      return result;
    }
    function resolveEmbed2(url, signal = null) {
      return __async(this, null, function* () {
        if (!url)
          return null;
        const hasAbort = typeof AbortController !== "undefined";
        if (hasAbort) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15e3);
          try {
            return yield _resolveEmbed(url, controller.signal);
          } catch (e) {
            return null;
          } finally {
            clearTimeout(timeoutId);
          }
        }
        return withTimeout(_resolveEmbed(url, signal), 15e3).catch(() => null);
      });
    }
    function _resolveEmbed(url, signal = null) {
      return __async(this, null, function* () {
        if (!url)
          return null;
        const urlLower = url.toLowerCase();
        if (DEAD_DOMAINS.some((d) => urlLower.includes(d)))
          return null;
        if (isMirror(urlLower, "VOE") || url.includes("voe.sx") || url.includes("voe-") || url.includes("voex.sx")) {
          const result = yield resolveVoe(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "STREAMWISH") || url.includes("streamwish") || url.includes("hlswish") || url.includes("filelions")) {
          const result = yield resolveHlswish(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "FILEMOON") || url.includes("filemoon")) {
          const result = yield resolveFilemoon(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "VIDHIDE") || url.includes("vidhide") || url.includes("vidhidepro") || url.includes("vidoza")) {
          const result = yield resolveVidhide(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "DOODSTREAM")) {
          const result = yield resolveDoodstream(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "DROPCDN")) {
          const result = yield resolveDropcdn(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "GOODSTREAM") || url.includes("goodstream") || url.includes("gs.one")) {
          const result = yield resolveGoodstream(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "FASTREAM") || url.includes("fastream") || url.includes("fembed")) {
          const result = yield resolveFastream(url, signal);
          if (result)
            return result;
        }
        if (url.includes("vimeos") || url.includes("vimeo") || url.includes("vms.sh")) {
          const result = yield resolveVimeos(url, signal);
          if (result)
            return result;
        }
        if (url.includes("supervideo")) {
          const result = yield resolveSupervideo(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "PIXELDRAIN")) {
          const result = yield resolvePixeldrain(url, signal);
          if (result)
            return applyPiping(result);
        }
        if (isMirror(urlLower, "LULUSTREAM")) {
          const result = yield resolveLulustream(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "OKRU")) {
          const result = yield resolveOkru(url, signal);
          if (result)
            return result;
        }
        if (url.includes("embed69.org") || url.includes("embed69")) {
          const result = yield resolveEmbed69(url, signal);
          if (result)
            return result;
        }
        if (url.includes("xupalace.org") || url.includes("xupalace")) {
          const result = yield resolveXupalace(url, signal);
          if (result)
            return result;
        }
        if (url.includes("mixdrop") || url.includes("m1xdrop")) {
          const result = yield resolveMixdrop(url, signal);
          if (result)
            return result;
        }
        if (url.includes("verhdlink")) {
          const result = yield resolveVerhdlink(url, signal);
          if (result)
            return result;
        }
        if (url.includes("streamtape") || url.includes("bysejikuar")) {
          const result = yield resolveStreamtape(url, signal);
          if (result)
            return result;
        }
        if (url.includes("playhydrax")) {
          const result = yield resolvePlayhydrax(url, signal);
          if (result)
            return result;
        }
        if (url.includes("sololatino.xyz")) {
          const result = yield resolveSololatino(url, signal);
          if (result)
            return result;
        }
        if (url.includes("krakenfiles")) {
          const result = yield resolveKrakenfiles(url, signal);
          if (result)
            return result;
        }
        if (url.includes("unlimplay")) {
          const result = yield resolveUnlimplay(url, signal);
          if (result)
            return result;
        }
        if (url.includes("vibuxer")) {
          const result = yield resolveVibuxer(url, signal);
          if (result)
            return result;
        }
        if (url.includes("emturbovid") || url.includes("turbovidhls")) {
          const result = yield resolveEmturbovid(url, signal);
          if (result)
            return result;
        }
        if (url.includes("buzzheavier") || url.includes("bzh.sh")) {
          const result = yield resolveBuzzheavier(url, signal);
          if (result)
            return applyPiping(result);
        }
        if (url.includes("tplayer.pelisgo.online")) {
          const result = yield resolveTplayer(url, signal);
          if (result)
            return applyPiping(result);
        }
        if (url.includes("vidsrc") || url.includes("moviesapi.to") || url.includes("moviesapi.club")) {
          const result = yield resolveVidsrc(url, signal);
          if (result)
            return result;
        }
        if (url.includes("embedseek") || url.includes("seekplays") || url.includes("seekstreaming")) {
          const result = yield resolveEmbedseek(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "VIDNEST")) {
          const result = yield resolveVidnest(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "VIDSONIC")) {
          const result = yield resolveVidsonic(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "BARMONREY")) {
          const result = yield resolveBarmonrey(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "VIDMOLY")) {
          const result = yield resolveVidmoly(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "UPNS")) {
          const result = yield resolveRpmvid(url, signal);
          if (result)
            return result;
        }
        if (url.includes("playmogo")) {
          const result = yield resolvePlaymogo(url, signal);
          if (result)
            return applyPiping(result);
        }
        if (isMirror(urlLower, "UNLIMPLAY") || isMirror(urlLower, "KRAKENFILES")) {
          const result = yield resolveGeneric(url, signal);
          if (result)
            return result;
        }
        const headers = getDirectCdnHeaders(url);
        return applyPiping({
          url,
          quality: "SD",
          verified: false,
          headers
        });
      });
    }
    module2.exports = { resolveEmbed: resolveEmbed2, getDirectCdnHeaders, applyPiping };
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
    function getTmdbAliases(tmdbId, mediaType) {
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
    module2.exports = { getTmdbTitle, getTmdbInfo: getTmdbInfo2, getCorrectImdbId, getTmdbAliases, TMDB_API_KEY };
  }
});

// src/playhubmax/extractor.js
var import_http = __toESM(require_http());
var import_engine = __toESM(require_engine());
var import_resolvers = __toESM(require_resolvers());
var import_tmdb = __toESM(require_tmdb());
var PHM_API = "https://api.playhubmax.com/api";
var UA = (0, import_http.getSessionUA)();
var API_HEADERS = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  Origin: "https://www.playhubmax.com",
  Referer: "https://www.playhubmax.com/"
};
var AES_KEY_STR = "33dff3b1c1362e45e1425fcc9724d6f3";
var AES_IV_STR = "33dff3b1c1362e45";
function decryptSources(b64) {
  try {
    const CryptoJS2 = require("crypto-js");
    const key = CryptoJS2.enc.Utf8.parse(AES_KEY_STR);
    const iv = CryptoJS2.enc.Utf8.parse(AES_IV_STR);
    const decrypted = CryptoJS2.AES.decrypt(b64, key, {
      iv,
      mode: CryptoJS2.mode.CBC,
      padding: CryptoJS2.pad.Pkcs7
    });
    const jsonStr = decrypted.toString(CryptoJS2.enc.Utf8);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log(`[PlayHubMax] AES Decrypt error: ${e.message}`);
    return [];
  }
}
function searchContents(q) {
  return __async(this, null, function* () {
    try {
      const data = yield (0, import_http.fetchJson)(`${PHM_API}/US/en/contents?q=${encodeURIComponent(q)}`, {
        headers: API_HEADERS
      });
      return data.data || [];
    } catch (e) {
      return [];
    }
  });
}
function getSources(type, uuid) {
  return __async(this, null, function* () {
    try {
      const data = yield (0, import_http.fetchJson)(`${PHM_API}/${type}/${uuid}/sources`, { headers: API_HEADERS });
      if (!data.data)
        return [];
      const sources = decryptSources(data.data);
      return sources.filter((s) => {
        var _a;
        return (_a = s.languages) == null ? void 0 : _a.includes("es");
      });
    } catch (e) {
      return [];
    }
  });
}
function getContentDetail(uuid) {
  return __async(this, null, function* () {
    try {
      return yield (0, import_http.fetchJson)(`${PHM_API}/en/contents/${uuid}`, { headers: API_HEADERS });
    } catch (e) {
      return {};
    }
  });
}
function extractStreams(tmdbId, mediaType, season, episode, title) {
  return __async(this, null, function* () {
    var _a, _b;
    if (!tmdbId)
      return [];
    console.log(`[PlayHubMax] Looking for content: ${tmdbId} (${mediaType})`);
    try {
      let mediaTitle = title;
      if (!mediaTitle && tmdbId) {
        const info = yield (0, import_tmdb.getTmdbInfo)(tmdbId, mediaType);
        mediaTitle = info == null ? void 0 : info.title;
      }
      if (!mediaTitle)
        return [];
      const type = mediaType === "series" || mediaType === "tv" ? "tv" : "movie";
      const candidates = yield searchContents(mediaTitle);
      const match = candidates.find((c) => {
        var _a2;
        return ((_a2 = c.title) == null ? void 0 : _a2.toLowerCase()) === mediaTitle.toLowerCase();
      });
      if (!match)
        return [];
      let finalSources = [];
      if (type === "tv") {
        const detail = yield getContentDetail(match.uuid);
        const seasonObj = (_a = detail.seasons) == null ? void 0 : _a.find((s) => parseInt(s.seasonNumber) === parseInt(season));
        if (!seasonObj)
          return [];
        const episodes = yield (0, import_http.fetchJson)(`${PHM_API}/en/episodes?season_id=${seasonObj.id}`, {
          headers: API_HEADERS
        });
        const ep = (_b = episodes.data) == null ? void 0 : _b.find((e) => parseInt(e.episodeNumber) === parseInt(episode));
        if (!ep)
          return [];
        finalSources = yield getSources("episode", ep.uuid);
      } else {
        finalSources = yield getSources("content", match.uuid);
      }
      const streams = yield Promise.all(
        finalSources.map((s) => __async(this, null, function* () {
          try {
            const result = yield (0, import_resolvers.resolveEmbed)(s.url);
            const finalUrl = (result == null ? void 0 : result.url) || s.url;
            return {
              langLabel: "Latino",
              serverLabel: s.hostName || "PlayHub",
              url: finalUrl,
              quality: "1080p",
              headers: (result == null ? void 0 : result.headers) || {
                "User-Agent": UA,
                Referer: "https://www.playhubmax.com/"
              }
            };
          } catch (e) {
            return null;
          }
        }))
      );
      const filtered = streams.filter((r) => r !== null);
      return yield (0, import_engine.finalizeStreams)(filtered, "PlayHubMax", mediaTitle);
    } catch (error) {
      console.error(`[PlayHubMax] Error: ${error.message}`);
      return [];
    }
  });
}

// src/playhubmax/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      return yield extractStreams(tmdbId, mediaType, season, episode);
    } catch (e) {
      console.error(`[PlayHubMax] Error: ${e.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
