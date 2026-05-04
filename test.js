const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetProvider = args[0] ? args[0].toLowerCase() : null;

const providersDir = path.join(__dirname, 'providers');
const testConfigs = [
  { tmdbId: '76478', mediaType: 'tv', season: 5, episode: 1 },
  // { tmdbId: '1396', mediaType: 'tv', season: 1, episode: 1 },
  // { tmdbId: '66732', mediaType: 'tv', season: 1, episode: 1 },
  // { tmdbId: '687163', mediaType: 'movie' },
  // { tmdbId: '423', mediaType: 'movie' },
  { tmdbId: '1327819', mediaType: 'movie' },
];

let providerFiles = fs.readdirSync(providersDir).filter(f => f.endsWith('.js') && !f.startsWith('_'));

if (targetProvider) {
  providerFiles = providerFiles.filter(f => f.replace('.js', '').toLowerCase() === targetProvider);
  console.log(`Testing specific provider: ${targetProvider}\n`);
}

console.log(`Found ${providerFiles.length} providers to test (${testConfigs.length} tests each)\n`);

async function testProvider(filename) {
  const name = filename.replace('.js', '');
  const providerPath = path.join(providersDir, filename);
  let movieStreams = 0;
  let tvStreams = 0;

  try {
    const mod = require(providerPath);
    if (!mod.getStreams) {
      console.log(`[${name}] SKIP - No getStreams export`);
      return { name, status: 'skip', error: null, movieStreams: 0, tvStreams: 0 };
    }

    const configPromises = testConfigs.map(async (config) => {
      const label = config.mediaType === 'movie'
        ? `Movie ${config.tmdbId}`
        : `TV ${config.tmdbId} S${config.season}E${config.episode}`;
      console.log(`[${name}] Testing ${label}...`);
      try {
        const streams = await mod.getStreams(
          config.tmdbId,
          config.mediaType,
          config.season || null,
          config.episode || null
        );
        console.log(`[${name}] ${label}: ${streams.length} streams`);
        return { config, streams };
      } catch (e) {
        console.log(`[${name}] ${label} error: ${e.message}`);
        return { config, streams: [] };
      }
    });

    const configResults = await Promise.all(configPromises);

    for (const result of configResults) {
      if (result.config.mediaType === 'movie') {
        movieStreams += result.streams.length;
      } else {
        tvStreams += result.streams.length;
      }
    }

    console.log(`[${name}] OK`);
    return { name, status: 'ok', error: null, movieStreams, tvStreams };
  } catch (e) {
    console.log(`[${name}] FAIL: ${e.message}`);
    return { name, status: 'fail', error: e.message, movieStreams: 0, tvStreams: 0 };
  }
}

async function main() {
  const results = await Promise.all(providerFiles.map(async (file) => {
    const result = await testProvider(file);
    console.log('');
    return result;
  }));

  const passed = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const totalMovieStreams = results.reduce((sum, r) => sum + r.movieStreams, 0);
  const totalTvStreams = results.reduce((sum, r) => sum + r.tvStreams, 0);

  console.log('='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total providers: ${results.length}`);
  console.log(`Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log(`Total streams found - Movie: ${totalMovieStreams} | TV: ${totalTvStreams}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('Provider Details:');
  console.log('-'.repeat(60));

  const sortedResults = [...results].sort((a, b) => {
    if (a.status === 'fail' && b.status !== 'fail') return -1;
    if (b.status === 'fail' && a.status !== 'fail') return 1;
    return b.movieStreams + b.tvStreams - (a.movieStreams + a.tvStreams);
  });

  sortedResults.forEach(r => {
    const streams = (r.movieStreams + r.tvStreams).toString().padStart(3);
    const movie = r.movieStreams.toString().padStart(3);
    const tv = r.tvStreams.toString().padStart(3);
    const status = r.status === 'ok' ? '✓' : r.status === 'fail' ? '✗' : '-';
    console.log(`${status} ${r.name.padEnd(20)} Movie: ${movie}  TV: ${tv}  Total: ${streams}`);
  });

  console.log('-'.repeat(60));

  if (failed > 0) {
    console.log('\nFailed providers:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

main();
