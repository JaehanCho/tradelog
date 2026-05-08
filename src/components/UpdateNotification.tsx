import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateNotification() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await check();
        if (u && !cancelled) setUpdate(u);
      } catch {
        // best-effort; silently ignore (e.g. dev mode, no network)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  return (
    <div className="update-toast">
      <div className="update-toast-body">
        <div className="update-toast-title">새 버전 {update.version} 사용 가능</div>
        {update.body && <div className="update-toast-msg">{update.body}</div>}
      </div>
      <div className="update-toast-actions">
        <button
          className="btn btn-secondary"
          onClick={() => setUpdate(null)}
          disabled={installing}
        >
          나중에
        </button>
        <button
          className="btn btn-primary"
          disabled={installing}
          onClick={async () => {
            setInstalling(true);
            try {
              await update.downloadAndInstall();
              await relaunch();
            } catch (e) {
              console.error("update install failed", e);
              setInstalling(false);
            }
          }}
        >
          {installing ? "설치 중…" : "지금 업데이트"}
        </button>
      </div>
    </div>
  );
}
