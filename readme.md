<p align="center">
  <h1 align="center">⚔️ JX2 DevStudio</h1>
  <p align="center">
    A specialized IDE for <strong>JX2 (Kingsoft Jianxia 2)</strong> game server development<br/>
    with multi-encoding support for legacy Chinese (GB18030) &amp; Vietnamese (Windows-1252) files.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-29-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Monaco_Editor-VS_Code_Engine-007ACC?logo=visualstudiocode" alt="Monaco" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/github/license/meesudzu/jx2-ide" alt="License" />
</p>

---

## 🎯 Why JX2 DevStudio?

JX2 game servers use **legacy encodings** that standard editors mishandle:

| File Type | Encoding | Content |
|-----------|----------|---------|
| `.lua` scripts | **GB18030** | Chinese comments, variable names, NPC dialogs |
| `.txt` configs | **Windows-1252** | Vietnamese item names, skill descriptions |
| Filenames | **GB18030** | Chinese characters in directory/file names |

Standard IDEs (VS Code, Sublime) either corrupt these files or can't search across encodings. **JX2 DevStudio solves this.**

## ✨ Features

### 🔤 Multi-Encoding Engine (The Core)
- **Toggle Switch** — Click the status bar to cycle between GB18030 / Windows-1252 / UTF-8
- **Lossless Re-interpretation** — Re-decodes raw bytes without corruption (never auto-converts to UTF-8)
- **Smart Detection** — Auto-detects encoding using byte-pattern heuristics + file extension hints
- **GB18030 Filenames** — File explorer correctly displays Chinese-encoded filenames

### 🔍 Cross-Encoding Search
- Searches for strings across **all three encodings simultaneously**
- Byte-level matching — search "Trang Bị" and find it in Windows-1252 files
- Results show which encoding matched, with file/line/context

### 📝 Editor
- **Monaco Editor** (VS Code's engine) with custom dark theme
- **Lua Syntax Highlighting** — Full Monarch tokenizer for Lua keywords, strings, comments
- **Tabular Config View** — Spreadsheet grid (AG Grid) for TSV .txt files
- Toggle between text view and grid view

### 📋 Log Watcher
- Real-time tail console for JX2 server logs
- Tabs for **Game Server**, **S3 Relay**, **Gateway**
- Color-coded log levels (error/warn/info)
- Text filtering and auto-scroll

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+** (install via [nvm](https://github.com/nvm-sh/nvm))
- **Git**

### Install & Run

```bash
# Clone
git clone git@github.com:meesudzu/jx2-ide.git
cd jx2-ide

# Install dependencies
npm install

# Start development
npm run dev
```

This opens the Electron IDE. Click **Open Folder** → select your JX2 server directory.

### Build for Production

```bash
# Build for your current platform
npm run build

# Build for a specific platform
npm run build:win     # Windows (.exe)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (.AppImage)
```

Binaries output to `release/` directory.

## 🏗️ Project Structure

```
jx2-ide/
├── electron/                     # Main process (Node.js)
│   ├── main.ts                   # App entry, window management
│   ├── preload.ts                # IPC bridge (context isolation)
│   ├── core/
│   │   ├── EncodingManager.ts    # ★ Byte-level encoding engine
│   │   └── SearchEngine.ts       # ★ Cross-encoding search
│   └── ipc/
│       ├── fileHandlers.ts       # File read/write/list
│       ├── searchHandlers.ts     # Search IPC
│       └── logHandlers.ts        # Log tail watcher
├── src/                          # Renderer process (React)
│   ├── App.tsx                   # Root layout
│   ├── stores/editorStore.ts     # Zustand state
│   ├── components/
│   │   ├── FileExplorer/         # File tree + GB18030 decoding
│   │   ├── Editor/               # Monaco + Lua highlighting
│   │   ├── TabBar/               # Open file tabs
│   │   ├── StatusBar/            # Encoding toggle
│   │   ├── SearchPanel/          # Search UI
│   │   ├── TabularView/          # AG Grid TSV editor
│   │   └── LogWatcher/           # Server log console
│   └── styles/index.css          # Dark theme
├── .github/workflows/
│   └── release.yml               # CI/CD auto-build on tag
├── electron-builder.yml          # Build config
├── plan.md                       # Roadmap
└── CHANGELOG.md                  # Version history
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open project folder |
| `Ctrl+S` | Save current file |
| `Ctrl+Shift+F` | Global cross-encoding search |
| `` Ctrl+` `` | Toggle log watcher |

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| Desktop Shell | Electron 29 |
| UI Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Code Editor | Monaco Editor (VS Code engine) |
| Encoding | iconv-lite |
| Data Grid | AG Grid |
| File Watching | chokidar |
| State Management | Zustand |
| CI/CD | GitHub Actions |
| Packaging | electron-builder |

## 🗺️ Roadmap

See [plan.md](plan.md) for the full roadmap. Key upcoming milestones:

- **v1.1** — Lua autocomplete, go-to-definition, find & replace
- **v1.2** — Regex search, batch re-encode, search & replace across project
- **v1.3** — Config editor pro (validation, cross-reference)
- **v1.4** — JX2 server integration (start/stop, health monitor)
- **v1.6** — WSL / SSH remote connection
- **v2.0** — Git integration, plugin system, localization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and update `plan.md` + `CHANGELOG.md`
4. Push and open a Pull Request

## 📄 License

MIT © [meesudzu](https://github.com/meesudzu)
