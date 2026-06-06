"use client";

import { useLanguage } from "@/lib/i18n";

type Props = { onReset: () => void };

export function EmptyState({ onReset }: Props) {
  const { t } = useLanguage();

  return (
    <div className="empty-state" role="status">
      <span className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#ebebeb" strokeWidth="3"/>
          <path d="M22 32h20M22 24h20M22 40h12" stroke="#dddddd" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </span>
      <strong>{t.empty.title}</strong>
      <p>{t.empty.description}</p>
      <button type="button" onClick={onReset}>{t.empty.clear}</button>
    </div>
  );
}
