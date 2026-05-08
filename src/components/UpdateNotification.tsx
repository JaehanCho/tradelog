import { useCallback, useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { messages, useLocaleStore } from "../i18n";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; update: Update }
  | { kind: "uptodate"; showBanner: boolean }
  | { kind: "error"; message: string }
  | { kind: "installing" };

export function UpdateNotification() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const locale = useLocaleStore((s) => s.locale);
  const t = messages[locale];

  const runCheck = useCallback(async (manual = false) => {
    setStatus({ kind: "checking" });
    try {
      const u = await check();
      if (u) {
        console.log("[updater] update available:", u.version);
        setStatus({ kind: "available", update: u });
      } else {
        console.log("[updater] no update available");
        setStatus({ kind: "uptodate", showBanner: manual });
        if (manual) {
          window.setTimeout(
            () => setStatus({ kind: "uptodate", showBanner: false }),
            3500,
          );
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[updater] check failed:", e);
      setStatus({ kind: "error", message });
    }
  }, []);

  // Auto-check on mount (silent).
  useEffect(() => {
    void runCheck(false);
    (
      window as unknown as { __tradelogCheckUpdate?: (manual?: boolean) => Promise<void> }
    ).__tradelogCheckUpdate = (manual?: boolean) => runCheck(manual ?? true);
  }, [runCheck]);

  const install = useCallback(async () => {
    if (status.kind !== "available") return;
    const u = status.update;
    setStatus({ kind: "installing" });
    try {
      await u.downloadAndInstall();
      await relaunch();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.error("[updater] install failed:", e);
      setStatus({ kind: "error", message: t.update.installFailed(message) });
    }
  }, [status, t]);

  if (status.kind === "idle" || status.kind === "checking") return null;
  if (status.kind === "uptodate" && !status.showBanner) return null;

  if (status.kind === "uptodate" && status.showBanner) {
    return (
      <div className="update-toast update-toast-ok" role="status">
        <div className="update-toast-body">
          <div className="update-toast-title">{t.update.upToDate}</div>
        </div>
      </div>
    );
  }

  if (status.kind === "uptodate") return null; // showBanner=false fallthrough

  if (status.kind === "available" || status.kind === "installing") {
    const u = status.kind === "available" ? status.update : null;
    return (
      <div className="update-toast">
        <div className="update-toast-body">
          <div className="update-toast-title">
            {t.update.available(u?.version ?? "")}
          </div>
          {u?.body && <div className="update-toast-msg">{u.body}</div>}
        </div>
        <div className="update-toast-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setStatus({ kind: "uptodate", showBanner: false })}
            disabled={status.kind === "installing"}
          >
            {t.update.later}
          </button>
          <button
            className="btn btn-primary"
            disabled={status.kind === "installing"}
            onClick={install}
          >
            {status.kind === "installing" ? t.update.installing : t.update.installNow}
          </button>
        </div>
      </div>
    );
  }

  // error — surface it so user can report what went wrong
  return (
    <div className="update-toast update-toast-error" role="alert">
      <div className="update-toast-body">
        <div className="update-toast-title">{t.update.checkFailed}</div>
        <div className="update-toast-msg">{status.message}</div>
      </div>
      <div className="update-toast-actions">
        <button className="btn btn-secondary" onClick={() => void runCheck()}>
          {t.update.retry}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setStatus({ kind: "uptodate", showBanner: false })}
        >
          {t.update.close}
        </button>
      </div>
    </div>
  );
}

/** Imperative trigger so the sidebar can fire a re-check. */
export function triggerUpdateCheck() {
  const fn = (window as unknown as {
    __tradelogCheckUpdate?: () => Promise<void>;
  }).__tradelogCheckUpdate;
  if (fn) void fn();
}
