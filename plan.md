# JX2 DevStudio — Roadmap

## v1.0.0 — Core IDE (Current)

- [x] Project scaffolding (Electron + React + Vite)
- [x] EncodingManager — raw byte read/write/cache for GB18030, Windows-1252, UTF-8
- [x] Encoding detection heuristics (BOM, byte scoring, extension hints)
- [x] Status bar encoding toggle (cycle GB18030 → Win-1252 → UTF-8)
- [x] File Explorer with GB18030 filename decoding
- [x] Lazy-loading directory tree
- [x] Tab-based file system
- [x] Monaco Editor integration
- [x] Lua Monarch syntax highlighting
- [x] Custom JX2 Dark theme
- [x] Tabular Config View (AG Grid for TSV .txt files)
- [x] Cross-encoding SearchEngine (byte-level matching)
- [x] Search results UI with encoding badges
- [x] Log Watcher (chokidar tail for GS/Relay/Gateway)
- [x] Log filtering and color-coded levels
- [x] Keyboard shortcuts (Ctrl+O, Ctrl+S, Ctrl+Shift+F, Ctrl+`)
- [x] Dark theme CSS (VS Code-inspired)
- [x] Production build verified

## v1.1.0 — Editor Enhancements

- [ ] Lua autocomplete (JX2 API functions: Include, IncludeLib, etc.)
- [ ] Lua linting / error highlights
- [ ] Go-to-definition for `Include("\\script\\...")` paths
- [ ] Find & replace within file
- [ ] Multiple cursor / multi-select
- [ ] Minimap toggle
- [ ] Line bookmarks

## v1.2.0 — Advanced Encoding & Search

- [ ] Encoding auto-detect confidence indicator in status bar
- [ ] Batch re-encode tool (convert folder from GB18030 → UTF-8)
- [ ] Regex support in cross-encoding search
- [ ] Search & replace across project
- [ ] Search file filters (by extension, by folder)
- [ ] Search result grouping by file

## v1.3.0 — Config Editor Pro

- [ ] Column type detection (number, string, ID reference)
- [ ] Cell validation for config .txt files
- [ ] Add/delete rows and columns in grid view
- [ ] CSV export/import
- [ ] Diff view for config changes
- [ ] Config cross-reference (find which scripts use a config ID)

## v1.4.0 — JX2 Server Integration

- [ ] One-click server start/stop (gs, relay, gateway)
- [ ] Process health monitor (CPU, memory)
- [ ] Database connection viewer (gdb)
- [ ] Server config editor (servercfg.ini, relay.ini)
- [ ] Map list viewer (map_list.ini)

## v1.5.0 — Project Intelligence

- [ ] Lua call graph / dependency tree visualization
- [ ] Script usage analysis (which NPCs use which scripts)
- [ ] Item/skill ID cross-reference database
- [ ] Mission flow diagram generator
- [ ] Dead code detection

## v1.6.0 — Remote Connection (WSL / SSH)

- [ ] WSL backend — detect and connect to WSL distributions
- [ ] SSH backend — connect to remote servers via SSH (key + password auth)
- [ ] Remote file system adapter (read/write/list files over WSL or SSH)
- [ ] Remote terminal — integrated shell for WSL/SSH sessions
- [ ] Remote log watcher — tail logs on remote servers
- [ ] Connection manager UI (save/edit/delete connections)
- [ ] Auto-reconnect on connection drop
- [ ] Remote encoding support (same GB18030/Win-1252 pipeline over SSH)

## v1.7.0 — Build & Distribution

- [x] electron-builder config for Windows (.exe), macOS (.dmg), Linux (.AppImage)
- [x] GitHub Actions CI/CD — auto-build on release tag push
- [x] Cross-platform build matrix (Windows x64, macOS x64/arm64, Linux x64)
- [x] Auto-upload artifacts to GitHub Release
- [ ] Auto-updater integration (electron-updater)
- [ ] Code signing (Windows + macOS)
- [ ] Flatpak / Snap package for Linux

## v2.0.0 — Collaboration & Polish

- [ ] Git integration (diff, commit, push)
- [ ] Multi-window / split editor
- [ ] Plugin system for community extensions
- [ ] Localization (Vietnamese, Chinese UI)
- [ ] Installer / auto-updater (electron-builder)
- [ ] User preferences / settings panel
