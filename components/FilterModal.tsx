"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { AMENITY_OPTIONS, DEFAULT_FILTERS } from "@/lib/types";
import type { Filters } from "@/lib/types";

type Props = {
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
};

export function FilterModal({ filters, onApply, onClose }: Props) {
  const { locale, t } = useLanguage();
  const [local, setLocal] = useState<Filters>(filters);
  const numberLocale = locale === "th" ? "th-TH" : "en-US";

  function toggleAmenity(amenity: string) {
    setLocal((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function handleClear() {
    setLocal(DEFAULT_FILTERS);
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" aria-label={t.filter.close} onClick={onClose} />
      <section className="filter-modal" role="dialog" aria-modal="true" aria-labelledby="filter-title">
        <header>
          <button type="button" onClick={onClose} aria-label={t.filter.close}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2 id="filter-title">{t.filter.title}</h2>
          <span />
        </header>

        <div className="filter-body">
          <div className="filter-section">
            <h3>{t.filter.dailyBudget}</h3>
            <div className="filter-range-labels">
              <span>฿{local.priceMin.toLocaleString(numberLocale)}</span>
              <span>฿{local.priceMax >= 10_000 ? "10,000+" : local.priceMax.toLocaleString(numberLocale)}</span>
            </div>
            <div className="filter-dual-range">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={local.priceMin}
                onChange={(event) => setLocal((current) => ({ ...current, priceMin: Math.min(+event.target.value, current.priceMax - 100) }))}
                aria-label={t.filter.minPrice}
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={local.priceMax}
                onChange={(event) => setLocal((current) => ({ ...current, priceMax: Math.max(+event.target.value, current.priceMin + 100) }))}
                aria-label={t.filter.maxPrice}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>{t.filter.minimumRating}</h3>
            <div className="filter-range-labels">
              <span>★ {local.minRating === 0 ? t.filter.any : local.minRating.toFixed(1)}</span>
              <span>★ 5.0</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={local.minRating}
              onChange={(event) => setLocal((current) => ({ ...current, minRating: +event.target.value }))}
              aria-label={t.filter.minimumRating}
            />
          </div>

          <div className="filter-section">
            <h3>{t.filter.amenities}</h3>
            <div className="filter-chips">
              {AMENITY_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  className={local.amenities.includes(amenity) ? "is-active" : ""}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {t.filter.amenitiesMap[amenity as keyof typeof t.filter.amenitiesMap]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer>
          <button type="button" className="ghost-button" onClick={handleClear}>
            {t.filter.clearAll}
          </button>
          <button type="button" className="search-button" onClick={() => onApply(local)}>
            <span className="search-button-label">{t.filter.showSpaces}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
