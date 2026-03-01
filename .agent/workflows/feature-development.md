---
description: Workflow for creating or updating features in JX2 DevStudio
---

# Feature Development Workflow

When creating or updating any feature in the JX2 DevStudio project (`/home/dzu69/jx2-ide`), you **must** follow these steps:

## 1. Plan the feature
- Understand the requirements and identify which files to create/modify.
- Check `plan.md` to see if this feature is already listed under a version milestone.

## 2. Implement the feature
- Write the code (Electron backend, React components, styles, etc.).
- Follow existing patterns (IPC handlers in `electron/ipc/`, components in `src/components/`, core logic in `electron/core/`).

## 3. Update `plan.md`
// turbo
- If the feature is already listed, mark it as `[x]` (completed).
- If the feature is **new** and not listed, add it under the appropriate version milestone or create a new milestone.
- Keep checklist items concise — one line per feature.

## 4. Update `CHANGELOG.md`
// turbo
- Add the feature under `## [Unreleased]` → `### Added` section.
- If fixing a bug, use `### Fixed`.
- If changing existing behavior, use `### Changed`.
- If removing something, use `### Removed`.
- Use bullet points with a bold category label, e.g.: `- **Feature Name** — short description`.
- When a release is cut, move items from `[Unreleased]` to a new `## [x.y.z] — YYYY-MM-DD` section.

## 5. Verify
- Ensure the build still compiles: `npm run dev` or `npx vite build`.
- Update any affected tests.

## Summary of mandatory files to update on every feature change:

| File | Action |
|------|--------|
| `plan.md` | Tick `[x]` or add new item |
| `CHANGELOG.md` | Log under `[Unreleased]` |
