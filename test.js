const fs = require('fs');
const path = require('path');

const PROVIDER_TIMEOUT = 30000;

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

function buildTmdbCache(configs) {
  const cache = new Map();
  for (const c of configs) {
    cache.set(`${c.tmdbId}-${c.mediaType}`, { id: c.tmdbId });
  }
  return cache;
}

const originalConsoleLog = console.log;
const logLines = [];
const allCapturedProviderLogs = [];

function logBoth(msg) {
  originalConsoleLog(msg);
  logLines.push(msg);
}

function logFileOnly(msg) {
  logLines.push(msg);
}

console.log = function(...args) {
  allCapturedProviderLogs.push(args.join(' '));
};

console.warn = function(...args) {
  allCapturedProviderLogs.push('[WARN] ' + args.join(' '));
};

console.error = function(...args) {
  allCapturedProviderLogs.push('[ERROR] ' + args.join(' '));
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
  const detailedResults = [];

  try {
    const providerStart = Date.now();
    const mod = require(providerPath);
    if (!mod.getStreams) {
      logBoth(`${name.padEnd(15)} - SKIP (no getStreams)`);
      logFileOnly(`[${name}] SKIP - No getStreams export`);
      return { name, status: 'skip', error: null, movieStreams: 0, tvStreams: 0, time: 0, details: [], mismatches: 0 };
    }

    const configPromises = testConfigs.map(async (config) => {
      let streams = [];
      let error = null;
      let elapsed = 0;

      try {
        const result = await sem.run(async () => {
          const startTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT);
          try {
            const s = await mod.getStreams(
              config.tmdbId,
              config.mediaType,
              config.season || null,
              config.episode || null
            );
            clearTimeout(timeoutId);
            return { streams: s, elapsed: Date.now() - startTime };
          } catch (e) {
            clearTimeout(timeoutId);
            throw e;
          }
        });
        streams = result.streams;
        elapsed = result.elapsed;
      } catch (e) {
        error = e.message;
      }

      const streamDetails = streams.map(s => ({
        quality: s.quality || 'SD',
        url: s.url || '',
        title: s.title || s.name || '',
      }));

      return {
        config,
        streams: streamDetails,
        tmdb: { id: config.tmdbId },
        error,
        elapsed,
        unresolved: [],
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

    const providerElapsed = Date.now() - providerStart;
    const timeSec = (providerElapsed / 1000).toFixed(1);
    logBoth(`${name.padEnd(15)} ✓  ${String(movieStreams).padStart(2)}M/${String(tvStreams).padStart(2)}TV ${timeSec}s`);

    logFileOnly(`[${name}] OK (${providerElapsed}ms) - ${movieStreams + tvStreams} streams`);
    return { name, status: 'ok', error: null, movieStreams, tvStreams, time: providerElapsed, details: detailedResults, mismatches: 0 };
  } catch (e) {
    logBoth(`${name.padEnd(15)} ✗ FAIL: ${e.message}`);
    logFileOnly(`[${name}] FAIL: ${e.message}`);
    return { name, status: 'fail', error: e.message, movieStreams: 0, tvStreams: 0, time: 0, details: [], mismatches: 0 };
  }
}

async function runWithConcurrency(items, fn, concurrency = 5, delayMs = 100) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(item => fn(item)));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

async function main() {
  logBoth(`Testing ${providerFiles.length} providers (${testConfigs.length} configs each)...\n`);

  const tmdbCache = buildTmdbCache(testConfigs);
  const sem = new Semaphore(6);
  const results = await runWithConcurrency(providerFiles, f => testProvider(f, tmdbCache, sem), 10, 50);

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

        const typeLabel = config.mediaType === 'movie'
          ? `Movie \`${config.tmdbId}\``
          : `TV \`${config.tmdbId}\` S\`${config.season}\`E\`${config.episode}\``;

        logFileOnly(`### ${typeLabel} — TMDB ID: ${config.tmdbId}`);
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

  logFileOnly('# Results Summary');
  logFileOnly('');
  logFileOnly(`- **Providers:** ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭ Skipped: ${skipped}`);
  logFileOnly(`- **Streams:** ${totalMovieStreams + totalTvStreams} total (${totalMovieStreams} movie, ${totalTvStreams} TV)`);
  logFileOnly('');

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
  logBoth(`✅ Passed: ${passed} | ${totalMovieStreams}M/${totalTvStreams}TV`);
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
