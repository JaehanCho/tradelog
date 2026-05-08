import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useTradingDays } from "../hooks/useTradingDays";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function GoalProgress() {
  const goalBalance = useSettings((s) => s.goalBalance);
  const goalDate = useSettings((s) => s.goalDate);
  const setGoal = useSettings((s) => s.setGoal);
  const computed = useTradingDays((s) => s.computed);

  const last = [...computed]
    .reverse()
    .find((r) => r.end_balance !== null);
  const balance = last?.end_balance ?? 0;
  const progress = goalBalance > 0 ? Math.max(0, balance / goalBalance) : 0;
  const progressClamped = Math.min(progress, 1);

  const [editing, setEditing] = useState(false);
  const [draftBalance, setDraftBalance] = useState(String(goalBalance));
  const [draftDate, setDraftDate] = useState(goalDate);

  const save = async () => {
    const b = Number(draftBalance);
    if (Number.isFinite(b) && b > 0) {
      await setGoal(b, draftDate);
    }
    setEditing(false);
  };

  return (
    <div className="goal-progress">
      <div className="goal-progress-header">
        <span className="goal-progress-label">
          목표 {usd.format(goalBalance)} @ {goalDate}
        </span>
        <button
          className="goal-progress-edit"
          onClick={() => {
            setDraftBalance(String(goalBalance));
            setDraftDate(goalDate);
            setEditing(true);
          }}
        >
          수정
        </button>
      </div>
      <div className="goal-progress-bar">
        <div
          className="goal-progress-fill"
          style={{ width: `${progressClamped * 100}%` }}
        />
      </div>
      <div className="goal-progress-meta">
        <span>{(progress * 100).toFixed(1)}% 달성</span>
        <span>{usd.format(Math.max(0, goalBalance - balance))} 남음</span>
      </div>

      {editing && (
        <div className="goal-edit-overlay" onClick={() => setEditing(false)}>
          <div
            className="goal-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="goal-edit-title">목표 설정</div>
            <label className="goal-edit-row">
              <span>목표 잔액 (USD)</span>
              <input
                type="number"
                step="any"
                value={draftBalance}
                onChange={(e) => setDraftBalance(e.target.value)}
                autoFocus
              />
            </label>
            <label className="goal-edit-row">
              <span>목표 날짜</span>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />
            </label>
            <div className="goal-edit-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                취소
              </button>
              <button className="btn btn-primary" onClick={save}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
