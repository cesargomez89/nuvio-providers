# Nuvio Providers - Agent Guide

## Build Commands

```bash
node build.js              # Build all src/ providers
node build.js <provider>   # Build specific provider (e.g., node build.js vixsrc)
node build.js --minify     # Build with minification
node build.js --transpile  # Transpile async/await in providers/ for Hermes compatibility
npm run build:watch        # Watch mode (auto-rebuild on file changes)
npm start                  # Start local dev server (serves providers/ and manifest.json)
```

## Hermes Compatibility

**Critical**: The Nuvio app uses Hermes JS engine which does NOT support `async/await` in dynamically loaded plugins. The build script transpiles async/await to ES2016 generators automatically.

- Always use `src/` directory for development (multi-file workflow)
- Always run `node build.js <provider>` before testing in-app
- Local Node.js tests may pass but app may crash - always verify with Plugin Tester

## Development Workflows

### Multi-File (Recommended)
1. Create `src/<provider>/index.js` - entry point exports `getStreams(tmdbId, mediaType, season, episode)`
2. Use `async/await` freely in src/ files
3. Build: `node build.js <provider>` → outputs to `providers/<provider>.js`

### Single-File (Legacy)
1. Write directly in `providers/<provider>.js`
2. Use Promise chains (`.then()`) OR use `--transpile` flag after writing async code

## Available Modules (pre-bundled)

| Module | Usage |
|--------|-------|
| `cheerio-without-node-native` | HTML parsing |
| `crypto-js` | Encryption/decryption |
| `axios` | HTTP requests |
| `fetch` | Native global |
| `console` | Native global |

## Stream Object Format

```javascript
{
  name: "ProviderName",      // Required: provider identifier
  title: "1080p Stream",      // Required: display name
  url: "https://...",        // Required: direct stream URL (m3u8/mp4/mkv)
  quality: "1080p",          // Optional: 4K, 1080p, 720p, CAM
  size: "2.5 GB",            // Optional
  headers: {                 // Optional: playback headers
    Referer: "https://...",
    User-Agent: "Mozilla..."
  }
}
```

## Testing

1. **Local**: Create `test.js` with `const { getStreams } = require('./providers/myprovider.js');` and run `node test.js`
2. **In-App**: Use Plugin Tester in debug build (requires `npm start` running and same Wi-Fi)

## Project Structure

```
src/           → Multi-file development (edit here)
providers/    → Built output (used by app)
manifest.json → Provider registry
build.js      → Bundler + transpiler
server.js     → Local HTTP server for app testing
```

## Adding a Provider

1. Create `src/<name>/index.js` with exported `getStreams` function
2. Add to `manifest.json` with `"filename": "providers/<name>.js"`
3. Build: `node build.js <name>`