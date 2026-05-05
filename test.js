const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
const { normalizeTitle } = require('./src/utils/title.js');

class Semaphore {
  constructor(max) { this.max = max; this.current = 0; this.queue = []; }
  acquire() {
    return new Promise(resolve => {
      if (this.current < this.max) { this.current++; resolve(); }
      else { this.queue.push(resolve); }
    });
  }
  release() {
    if (this.queue.length > 0) this.queue.shift()();
    else this.current--;
  }
  async run(fn) { await this.acquire(); try { return await fn(); } finally { this.release(); } }
}

const args = process.argv.slice(2);
const targetProvider = args[0] ? args[0].toLowerCase() : null;

const providersDir = path.join(__dirname, 'providers');
const testConfigs = [
  { tmdbId: '1396', mediaType: 'tv', season: 1, episode: 1 },
  { tmdbId: '66732', mediaType: 'tv', season: 1, episode: 1 },
  { tmdbId: '76479', mediaType: 'tv', season: 5, episode: 1 },
  { tmdbId: '687163', mediaType: 'movie' },
  { tmdbId: '423', mediaType: 'movie' },
  { tmdbId: '603', mediaType: 'movie' },
];

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const TMDB_TIMEOUT = 5000;

function isMovie(mediaType) {
  return mediaType === 'movie' || mediaType === 'movies';
}

async function fetchTmdbInfo(tmdbId, mediaType, language) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TMDB_TIMEOUT);
  try {
    const type = isMovie(mediaType) ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    return {
      title: data.title || data.name || null,
      year: (data.release_date || data.first_air_date || '').split('-')[0] || '',
    };
  } catch {
    clearTimeout(timeout);
    return { title: null, year: '' };
  }
}

async function fetchAllTmdbData(configs) {
  const unique = new Map();
  for (const c of configs) {
    const key = `${c.tmdbId}-${c.mediaType}`;
    if (!unique.has(key)) unique.set(key, c);
  }
  const entries = Array.from(unique.values());
  const results = await Promise.all(entries.map(c =>
    Promise.all([
      fetchTmdbInfo(c.tmdbId, c.mediaType, 'es-MX'),
      fetchTmdbInfo(c.tmdbId, c.mediaType, 'en-US'),
    ])
  ));
  const cache = new Map();
  entries.forEach((c, i) => {
    cache.set(`${c.tmdbId}-${c.mediaType}`, { es: results[i][0], en: results[i][1] });
  });
  return cache;
}

function analyzeProviderLogs(consoleOutput, tmdbTitle, tmdbEnTitle) {
  const unresolved = [];

  const confirmedPattern = /✓ Título confirmado:\s*"([^"]+)"/i;
  const confirmedLine = consoleOutput.find(line => confirmedPattern.test(line));
  if (confirmedLine && tmdbTitle) {
    const confirmedTitle = confirmedLine.match(confirmedPattern)[1];
    const normTmdb = normalizeTitle(tmdbTitle);
    const normEn = tmdbEnTitle ? normalizeTitle(tmdbEnTitle) : null;
    const normConfirmed = normalizeTitle(confirmedTitle);
    if (normConfirmed !== normTmdb && (!normEn || normConfirmed !== normEn)) {
      unresolved.push(`Found: "${confirmedTitle}" but no match with TMDB titles`);
    }
    return unresolved;
  }

  const titlePatterns = [
    /Match found:\s*(.+)/i,
    /Selected \(exact\):\s*(.+)/i,
    /Selected \(best\):\s*(.+)/i,
    /Encontrado.*:\s*(.+)/i,
  ];

  const foundTitles = [];
  for (const line of consoleOutput) {
    for (const p of titlePatterns) {
      const m = line.match(p);
      if (m) foundTitles.push(m[1]);
    }
  }

  if (foundTitles.length > 0 && tmdbTitle) {
    const normTmdb = normalizeTitle(tmdbTitle);
    const normEn = tmdbEnTitle ? normalizeTitle(tmdbEnTitle) : null;

    const anyMatch = foundTitles.some(ft => {
      const normFt = normalizeTitle(ft);
      return normFt === normTmdb || (normEn && normFt === normEn);
    });

    if (!anyMatch) {
      unresolved.push(`Found: "${foundTitles[0]}" but no match with TMDB titles`);
    }
  }

  return unresolved;
}

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const logLines = [];
const allCapturedProviderLogs = [];
const logStorage = new AsyncLocalStorage();

function logBoth(msg) {
  originalConsoleLog(msg);
  logLines.push(msg);
}

function logFileOnly(msg) {
  logLines.push(msg);
}

console.log = function(...args) {
  const msg = args.join(' ');
  const store = logStorage.getStore();
  if (store) store.push(msg);
  allCapturedProviderLogs.push(msg);
};

console.warn = function(...args) {
  const msg = '[WARN] ' + args.join(' ');
  const store = logStorage.getStore();
  if (store) store.push(msg);
  allCapturedProviderLogs.push(msg);
};

console.error = function(...args) {
  const msg = '[ERROR] ' + args.join(' ');
  const store = logStorage.getStore();
  if (store) store.push(msg);
  allCapturedProviderLogs.push(msg);
};

let providerFiles = fs.readdirSync(providersDir).filter(f => f.endsWith('.js') && !f.startsWith('_'));

if (targetProvider) {
  providerFiles = providerFiles.filter(f => f.replace('.js', '').toLowerCase() === targetProvider);
  logBoth(`Testing specific provider: ${targetProvider}\n`);
}

logBoth(`Found ${providerFiles.length} providers to test (${testConfigs.length} tests each)\n`);

async function testProvider(filename, tmdbCache, sem) {
  const name = filename.replace('.js', '');
  const providerPath = path.join(providersDir, filename);
  let movieStreams = 0;
  let tvStreams = 0;
  let totalTime = 0;
  const detailedResults = [];
  let mismatchCount = 0;

  try {
    const mod = require(providerPath);
    if (!mod.getStreams) {
      logBoth(`${name.padEnd(15)} - SKIP (no getStreams)`);
      logFileOnly(`[${name}] SKIP - No getStreams export`);
      return { name, status: 'skip', error: null, movieStreams: 0, tvStreams: 0, time: 0, details: [], mismatches: 0 };
    }

    const configPromises = testConfigs.map(async (config) => {
      const key = `${config.tmdbId}-${config.mediaType}`;
      const cached = tmdbCache.get(key);
      const tmdbInfo = cached.es;
      const enTitle = cached.en.title;

      const startTime = Date.now();
      let streams = [];
      let error = null;
      const capturedLogs = [];

      try {
        streams = await sem.run(() => logStorage.run(capturedLogs, () => mod.getStreams(
          config.tmdbId,
          config.mediaType,
          config.season || null,
          config.episode || null
        )));
      } catch (e) {
        error = e.message;
      }

      const unresolved = analyzeProviderLogs(capturedLogs, tmdbInfo.title, enTitle);
      if (unresolved.length > 0) mismatchCount += unresolved.length;

      const elapsed = Date.now() - startTime;
      totalTime += elapsed;

      const streamDetails = streams.map(s => ({
        quality: s.quality || 'SD',
        url: s.url || '',
        title: s.title || s.name || '',
      }));

      return {
        config,
        streams: streamDetails,
        tmdb: tmdbInfo,
        tmdbEn: enTitle,
        error,
        elapsed,
        unresolved,
      };
    });

    const configResults = await Promise.all(configPromises);

    for (const result of configResults) {
      if (result.config.mediaType === 'movie') {
        movieStreams += result.streams.length;
      } else {
        tvStreams += result.streams.length;
      }
      detailedResults.push(result);
    }

    const timeSec = (totalTime / 1000).toFixed(1);
    logBoth(`${name.padEnd(15)} ✓  ${String(movieStreams).padStart(2)}M/${String(tvStreams).padStart(2)}TV ${timeSec}s`);

    logFileOnly(`[${name}] OK (${totalTime}ms) - ${movieStreams + tvStreams} streams, ${mismatchCount} mismatches`);
    return { name, status: 'ok', error: null, movieStreams, tvStreams, time: totalTime, details: detailedResults, mismatches: mismatchCount };
  } catch (e) {
    logBoth(`${name.padEnd(15)} ✗ FAIL: ${e.message}`);
    logFileOnly(`[${name}] FAIL: ${e.message}`);
    return { name, status: 'fail', error: e.message, movieStreams: 0, tvStreams: 0, time: 0, details: [], mismatches: 0 };
  }
}

async function runWithConcurrency(items, fn, concurrency = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(item => fn(item)));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  logBoth(`Testing ${providerFiles.length} providers (${testConfigs.length} configs each)...\n`);

  const tmdbCache = await fetchAllTmdbData(testConfigs);
  const sem = new Semaphore(30);
  const results = await Promise.all(providerFiles.map(f => testProvider(f, tmdbCache, sem)));

  logBoth('\n─────────────────────────────────────────────');

  logFileOnly('');
  logFileOnly('# Test Configurations');
  logFileOnly('');
  testConfigs.forEach(c => {
    const label = c.mediaType === 'movie'
      ? `- Movie \`${c.tmdbId}\``
      : `- TV \`${c.tmdbId}\` S\`${c.season}\`E\`${c.episode}\``;
    logFileOnly(`  ${label}`);
  });
  logFileOnly('');

  logFileOnly('# Detailed Stream Results');
  logFileOnly('');

  for (const provider of results) {
    logFileOnly(`## ${provider.name}`);
    logFileOnly('');

    if (provider.details && provider.details.length > 0) {
      for (const detail of provider.details) {
        const config = detail.config;
        const tmdb = detail.tmdb;
        const tmdbEn = detail.tmdbEn;

        const typeLabel = config.mediaType === 'movie'
          ? `Movie \`${config.tmdbId}\``
          : `TV \`${config.tmdbId}\` S\`${config.season}\`E\`${config.episode}\``;

        const titleInfo = tmdb.title ? `${tmdb.title}${tmdb.year ? ` (${tmdb.year})` : ''}` : `ID: ${config.tmdbId}`;
        const enTitleInfo = tmdbEn && tmdbEn !== tmdb.title ? ` [EN: ${tmdbEn}]` : '';

        logFileOnly(`### ${typeLabel} — ${titleInfo}${enTitleInfo}`);
        logFileOnly('');

        if (detail.error) {
          logFileOnly(`> **ERROR:** ${detail.error}`);
        } else if (detail.unresolved && detail.unresolved.length > 0) {
          for (const u of detail.unresolved) {
            logFileOnly(`> ⚠ **UNRESOLVED** — ${u}`);
          }
        }

        if (detail.streams && detail.streams.length > 0) {
          for (const stream of detail.streams) {
            logFileOnly(`- **${stream.quality}** | \`${stream.url}\``);
          }
        } else if (!detail.error && (!detail.unresolved || detail.unresolved.length === 0)) {
          logFileOnly(`_No streams found._`);
        }
        logFileOnly('');
      }
    } else if (provider.status === 'skip') {
      logFileOnly(`_Skipped — no getStreams export._`);
      logFileOnly('');
    } else if (provider.status === 'fail') {
      logFileOnly(`> **ERROR:** ${provider.error}`);
      logFileOnly('');
    }
  }

  const passed = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const totalMovieStreams = results.reduce((sum, r) => sum + r.movieStreams, 0);
  const totalTvStreams = results.reduce((sum, r) => sum + r.tvStreams, 0);

  const totalMismatches = results.reduce((sum, r) => sum + (r.mismatches || 0), 0);

  logFileOnly('# Results Summary');
  logFileOnly('');
  logFileOnly(`- **Providers:** ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭ Skipped: ${skipped}`);
  logFileOnly(`- **Streams:** ${totalMovieStreams + totalTvStreams} total (${totalMovieStreams} movie, ${totalTvStreams} TV)`);
  logFileOnly(`  - ⚠ Title Mismatches: ${totalMismatches}`);
  logFileOnly('');

  const withMismatches = results.filter(r => (r.mismatches || 0) > 0);
  if (withMismatches.length > 0) {
    logFileOnly('### Providers with Title Mismatches');
    withMismatches.forEach(r => {
      logFileOnly(`  - **${r.name}**: ${r.mismatches} mismatches`);
    });
    logFileOnly('');
  }

  logFileOnly('### Provider Details');
  logFileOnly('');
  logFileOnly('| Status | Provider | Movie | TV | Total | Time |');
  logFileOnly('|--------|----------|-------|----|-------|------|');

  const sortedResults = [...results].sort((a, b) => {
    if (a.status === 'fail' && b.status !== 'fail') return -1;
    if (b.status === 'fail' && a.status !== 'fail') return 1;
    return b.time - a.time;
  });

  sortedResults.forEach(r => {
    const total = r.movieStreams + r.tvStreams;
    const status = r.status === 'ok' ? '✅' : r.status === 'fail' ? '❌' : '⏭';
    logFileOnly(`| ${status} | ${r.name} | ${r.movieStreams} | ${r.tvStreams} | ${total} | ${(r.time / 1000).toFixed(1)}s |`);
  });

  logFileOnly('');
  logBoth(`✅ Passed: ${passed} | ${totalMovieStreams}M/${totalTvStreams}TV | Mismatches: ${totalMismatches}`);
  logBoth(`Log: test.md(${logLines.length} lines)`);

  logFileOnly('\n');
  logFileOnly('---');
  logFileOnly('# Raw Provider Output');
  logFileOnly('');
  logFileOnly('```');
  logFileOnly(allCapturedProviderLogs.join('\n'));
  logFileOnly('```');

  const logPath = path.join(__dirname, 'test.md');
  fs.writeFileSync(logPath, logLines.join('\n'), 'utf8');

  if (failed > 0) {
    logBoth('\nFailed providers:');
    results.filter(r => r.status === 'fail').forEach(r => {
      logBoth(`  ✗ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

main().catch(err => {
  originalConsoleLog('Unhandled error in main():', err);
  process.exit(1);
});
