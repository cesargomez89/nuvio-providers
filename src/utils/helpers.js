function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function padEpisode(episode) {
    return String(episode).padStart(2, "0");
}

function isMovie(mediaType) {
    return mediaType === "movie" || mediaType === "movies";
}

function cleanTmdbId(tmdbId) {
    return tmdbId ? tmdbId.toString().split(":")[0] : tmdbId;
}

function toDoubleBase64(str) {
    try {
        if (typeof btoa !== "undefined") return btoa(str);
    } catch (e) {}
    return Buffer.from(str, 'utf-8').toString('base64');
}

module.exports = { sleep, padEpisode, isMovie, cleanTmdbId, toDoubleBase64 };
