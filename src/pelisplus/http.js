const BASE_URL = "https://www.pelisplushd.la";
const LOGO = "https://www.pelisplushd.la/images/logo/logo5.png";
const DEFAULT_UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const COMMON_HEADERS = {
    "User-Agent": DEFAULT_UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="142", "Google Chrome";v="142", "Not-A.Brand";v="99", "Opera":v="126"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
};

export async function fetchText(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {...COMMON_HEADERS, ...options.headers},
            ...options
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} for ${url}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`[PelisPlusHD] Fetch error: ${error.message}`);
        throw error;
    }
}

export async function fetchJson(url, options = {}) {
    const raw = await fetchText(url, options);
    return JSON.parse(raw);
}

export async function fetchHtml(url, referer) {
    try {
        const headers = {...COMMON_HEADERS};
        if (referer) {
            headers["Referer"] = referer;
            headers["Sec-Fetch-Site"] = "same-origin";
        }
        const response = await fetch(url, { headers });
        if (!response.ok)
            throw new Error(`HTTP Error: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`[PelisPlusHD] fetchHtml error: ${error.message}`);
        return "";
    }
}

export { BASE_URL, LOGO };