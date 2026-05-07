const DEFAULT_CHROME_UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_TIMEOUT = 8000;

let sessionUA = null;

function setSessionUA(ua) {
  sessionUA = ua;
}

function getSessionUA() {
  return sessionUA || DEFAULT_CHROME_UA;
}

function getStealthHeaders() {
  return {
    "User-Agent": getSessionUA(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7,es-419;q=0.6",
    "Connection": "keep-alive",
    "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Android"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
  };
}

const DEFAULT_UA = getSessionUA();
const MOBILE_UA = getSessionUA();

async function request(url, options = {}) {
  const opt = options || {};
  const currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA();
  const headers = Object.assign({
    "User-Agent": currentUA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"
  }, opt.headers);

  try {
    const fetchOptions = Object.assign({
      redirect: opt.redirect || "follow",
      skipSizeCheck: true
    }, opt, {
      headers
    });

    if (opt.signal)
      fetchOptions.signal = opt.signal;

    const response = await fetch(url, fetchOptions);

    if (opt.redirect === "manual" && (response.status === 301 || response.status === 302)) {
      const redirectUrl = response.headers.get("location");
      console.log(`[HTTP] Redirección detectada (Manual): ${redirectUrl}`);
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
}

async function fetchHtml(url, options) {
  const res = await request(url, options);
  return await res.text();
}

async function fetchJson(url, options) {
  const res = await request(url, options);
  return await res.json();
}

async function fetchWithTimeout(url, timeout = DEFAULT_TIMEOUT, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const result = await request(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

module.exports = {
  request,
  fetchHtml,
  fetchJson,
  fetchWithTimeout,
  getSessionUA,
  setSessionUA,
  getStealthHeaders,
  DEFAULT_UA,
  MOBILE_UA,
  DEFAULT_TIMEOUT
};