# Provider Restoration Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Port actual scraping logic from pluggin-latino/providers/ back to nuvio-providers/src/ placeholders

**Architecture:** Extract provider-specific modules (http.js, tmdb.js) from bundled providers and update extractor.js files with real logic. Keep existing shared utils. Build all at end.

**Tech Stack:** JavaScript (async/await), Node.js fetch, Cheerio

---

## Phase 1: Providers with http.js modules (pelisplus, fuegocine, playhubmax)

### Task 1: Extract src/pelisplus/http.js from pelisplus.js

**Files:**
- Create: `src/pelisplus/http.js`
- Source: `pluggin-latino/providers/pelisplus.js:76-147`

**Step 1: Extract module**

Read lines 76-147 from `/home/cesar/projects/pluggin-latino/providers/pelisplus.js` and write to `/home/cesar/projects/nuvio-providers/src/pelisplus/http.js`

**Step 2: Build provider**

Run: `node build.js pelisplus`
Expected: Success with custom http.js included

### Task 2: Extract src/fuegocine/http.js from fuegocine.js

**Files:**
- Create: `src/fuegocine/http.js`
- Source: `pluggin-latino/providers/fuegocine.js:78-??`

**Step 1: Find and extract http module**

Search for fuegocine http.js module start (var require_http) and extract

### Task 3: Extract src/playhubmax/http.js from playhubmax.js

**Files:**
- Create: `src/playhubmax/http.js`
- Source: `pluggin-latino/providers/playhubmax.js:78-??`

---

## Phase 2: Providers with tmdb.js modules

### Task 4: Extract src/seriesmetro/tmdb.js

**Files:**
- Create: `src/seriesmetro/tmdb.js`
- Source: `pluggin-latino/providers/seriesmetro.js` (search for tmdb module)

### Task 5: Extract src/cinecalidad/tmdb.js

**Files:**
- Create: `src/cinecalidad/tmdb.js`

### Task 6: Extract other tmdb providers

- sololatino/tmdb.js
- tioplus/tmdb.js
- pelisgo/tmdb.js
- pelispanda/tmdb.js
- pelispedia/tmdb.js

---

## Phase 3: Update extractor.js files

### Task 7: Update src/pelisplus/extractor.js

**Files:**
- Modify: `src/pelisplus/extractor.js`
- Source: `pluggin-latino/providers/pelisplus.js` (find extractStreams function)

### Task 8: Update src/seriesmetro/extractor.js

### Task 9: Update remaining extractors

---

## Phase 4: Build Verification

### Task 10: Build all providers

Run: `node build.js`

### Task 11: Verify with test

---

## Plan Complete

Two execution options:

1. **Subagent-Driven (this session)** - Fresh subagent per task, review between tasks
2. **Parallel Session (separate)** - New session with executing-plans

**Choice?**