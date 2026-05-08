import { useCallback, useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; update: Update }
  | { kind: "uptodate" }
  | { kind: "error"; message: string }
  | { kind: "installing" };

export function UpdateNotification() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const runCheck = useCallback(async () => {
    setStatus({ kind: "checking" });
    try {
      const u = await check();
      if (u) {
        // eslint-disable-next-line no-console
        console.log("[updater] update available:", u.version);
        setStatus({ kind: "available", update: u });
      } else {
        // eslint-disable-next-line no-console
        console.log("[updater] no update available");
        setStatus({ kind: "uptodate" });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.error("[updater] check failed:", e);
      setStatus({ kind: "error", message });
    }
  }, []);

  // Auto-check on mount.
  useEffect(() => {
    void runCheck();
    // also expose it on window for quick devtools poking
    (window as unknown as { __tradelogCheckUpdate?: () => Promise<void> }).__tradelogCheckUpdate = runCheck;
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
      setStatus({ kind: "error", message: `설치 실패: ${message}` });
    }
  }, [status]);

  if (status.kind === "idle" || status.kind === "checking") return null;
  if (status.kind === "uptodate") return null; // silent on success — no banner

  if (status.kind === "available" || status.kind === "installing") {
    const u = status.kind === "available" ? status.update : null;
    return (
      <div className="update-toast">
        <div className="update-toast-body">
          <div className="update-toast-title">
            새 버전 {u?.version} 사용 가능
          </div>
          {u?.body && <div className="update-toast-msg">{u.body}</div>}
        </div>
        <div className="update-toast-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setStatus({ kind: "uptodate" })}
            disabled={status.kind === "installing"}
          >
            나중에
          </button>
          <button
            className="btn btn-primary"
            disabled={status.kind === "installing"}
            onClick={install}
          >
            {status.kind === "installing" ? "설치 중…" : "지금 업데이트"}
          </button>
        </div>
      </div>
    );
  }

  // error — surface it so user can report what went wrong
  return (
    <div className="update-toast update-toast-error" role="alert">
      <div className="update-toast-body">
        <div className="update-toast-title">업데이트 확인 실패</div>
        <div className="update-toast-msg">{status.message}</div>
      </div>
      <div className="update-toast-actions">
        <button className="btn btn-secondary" onClick={() => void runCheck()}>
          다시 시도
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setStatus({ kind: "uptodate" })}
        >
          닫기
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
