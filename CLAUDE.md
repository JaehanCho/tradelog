# TradeLog — Claude operating notes

## Visual / layout verification (without the Tauri app)

The Tauri desktop app cannot be driven by Claude directly (no native UI
control). But Claude **can** verify CSS / layout / responsive behavior by
running the Vite dev server and driving a Chrome tab via the
`mcp__claude-in-chrome__*` tools.

### When to use this

- Layout bugs (grid/flex shrink, overflow, responsive breakpoints)
- Visual regressions in components (calendars, charts, tables)
- Hover/focus states, animations, popovers
- Responsive testing across window sizes (resize_window)
- DOM inspection for unexpected styles

### How to run

```bash
# Start Vite dev server (frontend only, no Tauri runtime)
pnpm dev   # serves on http://localhost:1420
```

Then in Claude:

1. `mcp__claude-in-chrome__tabs_context_mcp` — list tabs
2. `mcp__claude-in-chrome__tabs_create_mcp` — open `http://localhost:1420`
3. `mcp__claude-in-chrome__resize_window` — test breakpoints
4. `mcp__claude-in-chrome__read_page` / `javascript_tool` — inspect computed styles
5. `mcp__claude-in-chrome__gif_creator` — record interaction for review

### Caveats — what does NOT work in browser-only mode

- **Tauri IPC commands** (`get_all_trading_days`, `upsert_trading_day`,
  `rename_or_upsert_trading_day`, settings, etc.) — `invoke()` will throw
  because no Tauri runtime. The grid will be empty / errors visible.
- **Clipboard plugin** (`@tauri-apps/plugin-clipboard-manager`) — falls back
  to nothing in plain browser.
- **Auto-updater** — only runs in packaged Tauri builds.
- **DB writes** — no SQLite reachable from browser.

So this lane is for **visual / layout verification only**, not data flows.
For E2E with real data, use the packaged build (auto-update path).

### Useful patterns

- To pre-seed the in-memory store before checking layout, you can call the
  Zustand store directly via `javascript_tool`:
  ```js
  window.__tradelog_seed = (rows) => useTradingDays.setState({ raw: rows, computed: rows, /* ... */ });
  ```
  (Requires exposing the store on window during dev; not currently done.)
- Use `mcp__claude-in-chrome__resize_window` to verify the dashboard-row
  shrink behavior — the recurring class of CSS Grid `min-width: auto`
  bugs.

## Data import / DB ops

App data lives at `~/Library/Application Support/com.tradelog.app/db.sqlite`.

- **Always backup before bulk writes**:
  `sqlite3 db.sqlite ".backup db.sqlite.fullbackup-$(date +%Y%m%d-%H%M%S)"`
  (The `.backup` command is WAL-aware; plain `cp` only copies the main file
  and misses uncommitted WAL data.)
- **Schema**: `trade_date` (TEXT PK, YYYY-MM-DD), `deposit`, `withdrawal`,
  `end_balance`, `note`. `start_balance` is computed (not stored).
- App caches rows in Zustand on load. After external DB writes, **restart
  the app** to refresh.

## Keep docs in sync with code (do this every task)

Whenever a task ships changes that a user can perceive — new feature, new
shortcut, behavior change, dependency / runtime requirement, install or
release flow tweak — **update `README.md` in the same commit**, before
tagging. The README is public-facing; out-of-date claims are worse than
missing ones.

Specifically check:

- **Features list** — added/removed capabilities, new flows
- **Keyboard shortcuts table** — anything that changes the ⌘C / ⌘V / ⌘⇧V
  semantics, new modifiers, new actions
- **Architecture / Tech stack** — new plugins (e.g. clipboard-manager),
  removed dependencies
- **Roadmap** — strike completed items, add follow-ups discovered along
  the way
- **Install / Develop / Releasing** — flag changes, env-var additions,
  new requirements
- **Quick tour ASCII layout** — significant UI restructuring

Also keep these in sync where relevant:

- `tasks/todo.md` — log new findings (root causes, lessons) and remaining
  backlog items
- This file (`CLAUDE.md`) — capture new operating know-how once, so the
  next session inherits it

If a change is purely internal (refactor, dep bump, build-config tweak)
with no user-visible delta, no README update is required — but say so
explicitly in the commit body so it's clear the omission was deliberate.

## i18n

All user-visible strings live in **`src/i18n/messages.ts`** as a typed
`Messages` object. The `ko` bundle is the source of truth; the `en` bundle
must satisfy the same `Messages` type — TS will fail the build if a key is
missing. Components access translations via `useT()` from `src/i18n/index.ts`,
and the active locale is persisted to `app_setting.locale` via Zustand store
(`useLocaleStore`).

When adding a new user-visible string:

1. Add it to the `Messages` type, then `ko` and `en` (TS will guide you).
2. Use `t.<group>.<key>` in the component (`const t = useT();`).
3. Avoid concatenating translated fragments with raw JSX — use a function
   leaf (e.g. `overwrote: (date) => \`...\`,`) when interpolation is needed.
4. Don't translate inside `Intl.NumberFormat` strings — currency stays
   `en-US`, dates stay ISO. Only UI copy translates.

To add a new language: create a third entry in `messages.ts`, append the
locale code to the `Locale` union, and surface it in `LanguageToggle.tsx`.

## Versioning policy

Three files must stay in lock-step with each other:

- `package.json` (`"version"`)
- `src-tauri/tauri.conf.json` (`"version"`)
- `src-tauri/Cargo.toml` (`version = "..."`)

The version they all share is what the **next** release will be. Tags
(`v0.X.Y`) are the source of truth for what was actually shipped — see
`git tag --sort=-v:refname` for the history.

**Feature / fix / docs commits do NOT bump the version.** Land them at the
current in-development version. The `package.json` `version` already reads
ahead of the latest tag (e.g. tag `v0.2.0` shipped, `package.json` stays at
`0.2.0` until the next release prep, then bumps to `0.3.0`).

**Release commit pattern.** When the in-development work is shipping-ready:

1. Decide the new version using semver against the most recent tag:
   - Patch (`0.2.0` → `0.2.1`): bug fixes, tiny tweaks, no schema change.
   - Minor (`0.2.0` → `0.3.0`): new features, additive schema migrations,
     new commands. (This is the common case for TradeLog.)
   - Major (`1.0.0`): only for breaking changes the user must opt into.
2. Bump all 3 files to the new version.
3. `cargo update -p tradelog --manifest-path src-tauri/Cargo.toml`
   (refreshes `Cargo.lock`).
4. Verify: `pnpm test`, `pnpm exec tsc -b`, `cargo check` (in `src-tauri/`).
5. One commit, message style `chore: ship vX.Y.Z` (or
   `chore: bump to vX.Y.Z` if you want to separate the bump from the
   shipping decision). Body summarises what's in this version.
6. `git tag vX.Y.Z` and push (`git push && git push --tags`).
7. GH Actions builds and creates a draft release.
8. **Auto-promote on success** — after `gh run watch` returns 0,
   immediately run `gh release edit vX.Y.Z --draft=false --latest` and
   announce the published URL. This is **standing authorization**: do
   NOT prompt for confirmation. The auto-updater serves users on the
   previous version only after the release is promoted out of draft, so
   a manual gate would just delay updates that the user already wants.
9. Use `gh run watch <runId> --exit-status` (single notification) instead
   of poll loops with `gh run list` (spammy). On non-zero exit, surface
   the failed run's logs and stop — never promote a failed build.

**Commit-language rule:** all commit messages in English (per user
preference, locked in 2026-05-08).

**Why this split exists.** The auto-updater compares `tauri.conf.json`'s
version against `latest.json` from GitHub Releases. If `tauri.conf.json`
drifts behind the actual release, users on the previous version stop
seeing update prompts. So the tag-and-three-file dance is non-negotiable
on every release — but absolutely should not happen on every commit.

## Release flow (auto-update)

GH Actions secrets (signing key, etc.) are already provisioned. The
release flow above is the full procedure — no extra steps once the
version commit and tag are pushed.

## Pre-release verification (mandatory before tagging)

Background: v0.3.5 → v0.4.0 shipped after `cargo check`, `tsc -b`,
`cargo test`, and Vite/Chrome visual checks all passed — yet the
update half-installed and left users on a binary that panicked with
`MigrationDefinition(DatabaseTooFarAhead)`. **Those checks don't
exercise the packaged binary's startup path.** Don't trust them as
proof a release is shippable.

Before pushing a `vX.Y.Z` tag:

1. **Build the actual package locally** (not just `cargo check`):
   ```sh
   pnpm tauri build
   ```

2. **Launch the built `.app` once** and confirm it doesn't crash on
   startup. The Tauri setup hook runs DB migrations there — that's
   exactly the failure mode that `cargo check` misses.
   ```sh
   open src-tauri/target/universal-apple-darwin/release/bundle/macos/TradeLog.app
   # then quit it after the window appears
   ```

3. **Click the feature that the release adds.** Stocks tab, new
   modal, whatever. If you can't reach the new UI without crashing,
   the release isn't ready.

4. **Test the upgrade path** when the release changes the DB schema:
   - Backup `~/Library/Application Support/com.tradelog.app/db.sqlite`
   - Open the previous installed `.app` once to make sure your real
     DB is at the OLD schema version
   - Quit, install the new build, launch it — the new build should
     migrate cleanly and not crash on next launch of the same `.app`.

CI also runs these guards (in `release.yml`):
- `cargo test --locked` — catches migration regressions via the
  `migrations_apply_cleanly_to_fresh_db` and `migrations_are_idempotent`
  tests in `src-tauri/src/db.rs`
- `pnpm test` — JS unit tests
- **Packaged-binary smoke test** — launches the built `.app` headlessly
  for 5 seconds; if it exits early, the draft release is auto-deleted
  so the tag can be re-pushed after a fix

If you add a new migration: it MUST be additive (`CREATE TABLE IF NOT
EXISTS`, `INSERT OR IGNORE`) and bump `LATEST_SCHEMA_VERSION` in
`src-tauri/src/db.rs`. The `Db::open` snapshots `db.sqlite` to
`db.sqlite.pre-migration-<TS>.bak` (kept 5 deep) whenever it sees a
schema-version mismatch — that's the user's recovery escape hatch if
auto-update half-fails again.
