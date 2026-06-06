"use client";

import { useLanguage } from "@/lib/i18n";

type Props = {
  onClose: () => void;
};

export function LanguageModal({ onClose }: Props) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="language-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="language-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.languageModal.languageRegion}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="language-modal-close" type="button" aria-label={t.languageModal.close} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="language-tabs" role="tablist" aria-label={t.languageModal.languageRegion}>
          <button className="is-active" type="button" role="tab" aria-selected="true">
            {t.languageModal.languageRegion}
          </button>
          <button type="button" role="tab" aria-selected="false">
            {t.languageModal.currency}
          </button>
        </div>

        <div className="translation-card">
          <div>
            <strong>{t.languageModal.translation}</strong>
            <span>{t.languageModal.translationDescription}</span>
          </div>
          <span className="translation-toggle" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m6 12 4 4 8-8" />
            </svg>
          </span>
        </div>

        <section className="language-section" aria-labelledby="recommended-language">
          <h2 id="recommended-language">{t.languageModal.recommended}</h2>
          <div className="language-grid compact">
            <button
              className="language-option is-selected"
              type="button"
              onClick={() => setLocale(locale)}
            >
              <strong>{t.localeName}</strong>
              <span>{t.regionName}</span>
            </button>
          </div>
        </section>

        <section className="language-section" aria-labelledby="all-languages">
          <h2 id="all-languages">{t.languageModal.choose}</h2>
          <div className="language-grid">
            {t.languageModal.options.map((option) => (
              <button
                className={`language-option${locale === option.locale ? " is-selected" : ""}`}
                type="button"
                key={option.locale}
                aria-label={`${option.label}, ${option.region}`}
                onClick={() => {
                  setLocale(option.locale);
                  onClose();
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.region}</span>
                {locale === option.locale && <em>{t.languageModal.selected}</em>}
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
