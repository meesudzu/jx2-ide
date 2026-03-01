# Changelog

All notable changes to JX2 DevStudio will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] — 2026-03-01

### Added
- **Multi-Encoding Engine** — `EncodingManager` class with raw byte read/write/cache
  - GB18030, Windows-1252, UTF-8 support
  - Encoding detection heuristics (BOM check, byte-pattern scoring, file extension hints)
  - `reinterpret()` for lossless encoding toggle without disk I/O
  - File saving persists in selected encoding (never auto-converts to UTF-8)
- **Status Bar Encoding Toggle** — click to cycle GB18030 → Windows-1252 → UTF-8
- **File Explorer** — lazy-loading directory tree with GB18030 filename decoding
- **Monaco Editor** — integrated with encoding pipeline
  - Custom Lua Monarch syntax highlighting (keywords, strings, comments, numbers)
  - Custom "JX2 Dark" editor theme
- **Tabular Config View** — AG Grid spreadsheet for TSV .txt files
  - Auto-detects tab vs comma delimiter
  - First row as headers, editable cells
  - Toggle between text view and grid view
- **Cross-Encoding Search** — `SearchEngine` with byte-level matching
  - Encodes query into UTF-8, GB18030, Windows-1252 byte patterns
  - Searches raw file buffers, deduplicates across encodings
  - Results show file, line, encoding badge, context
- **Log Watcher** — chokidar-based tail console
  - Tabs for Game Server, S3 Relay, Gateway
  - Text filtering, auto-scroll, color-coded log levels
  - Handles log rotation
- **Keyboard Shortcuts** — Ctrl+O (open), Ctrl+S (save), Ctrl+Shift+F (search), Ctrl+` (logs)
- **Dark Theme** — VS Code-inspired with Inter + JetBrains Mono fonts
- **Electron + React + Vite** project structure with TypeScript
- **Zustand** state management for editor state

### Technical
- Node.js v20.20.0 (via nvm)
- Electron v29, Vite v5, React 18
- iconv-lite v0.6.3 for encoding conversion
- chokidar v3.6.0 for file watching
- ag-grid-react v31 for tabular editing

---

## [Unreleased]

### Added
- **Build & Distribution** (v1.7.0)
  - `electron-builder.yml` — cross-platform build config (Windows .exe, macOS .dmg, Linux .AppImage)
  - `.github/workflows/release.yml` — GitHub Actions CI/CD auto-build on `v*` tag push
  - Build matrix: Windows x64, macOS x64/arm64, Linux x64
  - Auto-upload binaries to GitHub Release with generated release notes
  - Platform-specific npm scripts: `build:win`, `build:mac`, `build:linux`

### Planned
- **Remote Connection** (v1.6.0) — WSL/SSH backend for remote file access, terminal, log watching
- Lua autocomplete for JX2 API functions
- Go-to-definition for `Include()` paths
- Batch re-encode tool
- Regex support in search
- Server start/stop integration
- Auto-updater (electron-updater)
- Git integration
