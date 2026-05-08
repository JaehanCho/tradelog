import { useLocaleStore, useT } from "../i18n";

export function LanguageToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();

  return (
    <div
      className="sidebar-lang-toggle"
      role="group"
      aria-label={t.language.toggleAriaLabel}
    >
      <button
        type="button"
        className={`sidebar-lang-btn ${locale === "ko" ? "active" : ""}`}
        aria-pressed={locale === "ko"}
        onClick={() => void setLocale("ko")}
      >
        KO
      </button>
      <button
        type="button"
        className={`sidebar-lang-btn ${locale === "en" ? "active" : ""}`}
        aria-pressed={locale === "en"}
        onClick={() => void setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
