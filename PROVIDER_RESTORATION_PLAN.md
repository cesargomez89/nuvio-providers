# Provider Restoration Plan

## Status: Placeholder Implementation

The 19 providers in this repo were added with placeholder extraction logic. The actual scraping/API implementation was never included in the repository.

## Current State (Completed)
- ✅ Created shared utilities: `src/utils/` (8 modules)
  - ua.js, http.js, m3u8.js, sorting.js, mirrors.js, engine.js, aes_gcm.js, resolvers.js
- ✅ Created resolvers: `src/resolvers/` (8 modules)
  - voe.js, hlswish.js, filemoon.js, vidhide.js, goodstream.js, fastream.js, vimeos.js, quality.js
- ✅ Created 19 provider index.js files
- ✅ Created 19 provider extractor.js placeholders
- ✅ All providers build successfully

## Providers Built
| Provider | Size | Status |
|----------|------|--------|
| cuevana_unbuendato | 56KB | ✅ Has real logic |
| seriesmetro | 21KB | Placeholder |
| cinecalidad | 21KB | Placeholder |
| brazucaplay | 6KB | Placeholder |
| hackstore2 | 6KB | Placeholder |
| cinehdplus | 6KB | Placeholder |
| cinemacity | 6KB | Placeholder |
| fuegocine | 6KB | Placeholder |
| pelisgo | 6KB | Placeholder |
| pelispanda | 6KB | Placeholder |
| pelisplus | 6KB | Placeholder |
| pelispedia | 6KB | Placeholder |
| playhubmax | 6KB | Placeholder |
| sololatino | 6KB | Placeholder |
| tioplus | 6KB | Placeholder |
| lamovie | 6KB | Placeholder |
| embed69 | 6KB | Placeholder |
| videasy | 6KB | Placeholder |
| xupalace | 6KB | Placeholder |

## Implementation Needed

Each provider's `src/<provider>/extractor.js` needs to be implemented with:

### For cuevana_unbuendato (ALREADY DONE)
- Already has real extraction logic calling https://cuevana.unbuendato.com API

### For Other Providers (TO DO)
Each needs:
1. Find the target website's API/search endpoint
2. Implement search by TMDB ID or title
3. Extract embed URLs from result pages
4. Handle TV shows (season/episode)
5. Use resolvers to convert embed URLs to stream URLs

## Resolvers Available
The following embed resolvers are implemented:
- `voe.js` - VOE.sx
- `hlswish.js` - StreamWish
- `filemoon.js` - Filemoon
- `vidhide.js` - VidHide  
- `goodstream.js` - GoodStream
- `fastream.js` - Fastream
- `vimeos.js` - Vimeo

## Build Command
```bash
node build.js              # Build all
node build.js <provider>   # Build specific
```

## Notes
- The placeholder extractors just log "Looking for content: {tmdbId}" and return []
- Real implementation requires reverse-engineering each streaming site
- Some sites may no longer exist or have changed their structure