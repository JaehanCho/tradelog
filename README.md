# TradeLog

macOS-native trading journal. Tauri 2 + React 18 + TypeScript + SQLite.

## Stack

- **Shell:** Tauri 2 (Rust) — macOS only
- **Frontend:** React 18 + Vite + TypeScript
- **Storage:** SQLite (`rusqlite` bundled) at `~/Library/Application Support/com.tradelog.app/db.sqlite`
- **Grid:** `react-data-grid` with custom multi-row TSV paste
- **Chart:** Recharts (`AreaChart` + `ReferenceLine`)
- **State:** Zustand
- **Auto-update:** `tauri-plugin-updater` against GitHub Releases

## Develop

```sh
pnpm install
pnpm tauri dev
```

## Test

```sh
pnpm test
```

## Build

```sh
pnpm tauri build --target universal-apple-darwin
```

The bundle lands at `src-tauri/target/universal-apple-darwin/release/bundle/macos/TradeLog.app`.

## Release & signing (action items for owner)

1. **Apple Developer ID** — `$99/yr`. Required for notarization.
2. **Tauri signer keys**

   ```sh
   pnpm tauri signer generate -w ~/.tauri/tradelog.key
   ```

   - Put the **private** key + password in GitHub Actions secrets:
     `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
   - Replace `pubkey` in `src-tauri/tauri.conf.json` with the printed public key.
3. **Updater endpoint** — replace `JaehanCho` in `tauri.conf.json` with the GitHub
   owner of the public release repo.
4. **Apple secrets** for notarization
   (`APPLE_*` env vars in `.github/workflows/release.yml`).

## Migrating the existing Excel journal

1. Open `매매_일지_달러.xlsx`, e.g. sheet `2026-04`.
2. Select rows 3–32 (data area), columns B–J. `⌘C`.
3. Switch to TradeLog, click into the grid, `⌘V`.
4. Repeat for `2026-05`. The equity curve and cumulative return are
   continuous across months.
