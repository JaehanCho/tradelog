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

## Release flow (auto-update)

Standing authorization (per user, GH Actions secrets pre-registered):
- Bump version in 3 places: `package.json`, `src-tauri/Cargo.toml`,
  `src-tauri/tauri.conf.json`
- `cargo update -p tradelog --manifest-path src-tauri/Cargo.toml`
- Verify: `pnpm test`, `pnpm exec tsc -b`
- Commit + tag + push (`v0.X.Y`); GH Actions builds + creates draft release
- After build: `gh release edit vX.Y.Z --draft=false --latest` to publish
- Use `gh run watch <runId> --exit-status` (single notification) — not poll
  loops with `gh run list` (spammy)
