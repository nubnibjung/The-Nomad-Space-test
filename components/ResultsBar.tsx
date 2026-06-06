"use client";

import { useLanguage } from "@/lib/i18n";
import type { Filters, SortOption } from "@/lib/types";

type Props = {
  count: number;
  isLoading: boolean;
  sortBy: SortOption;
  filters: Filters;
  activeFilterCount: number;
  viewMode: "split" | "list" | "map";
  onSortChange: (s: SortOption) => void;
  onViewChange: (v: "split" | "list" | "map") => void;
  onFilterOpen: () => void;
  onClearFilter: (key: keyof Filters) => void;
  categoryHeading: string;
};

export function ResultsBar({
  count, isLoading, sortBy, filters, activeFilterCount,
  viewMode, onSortChange, onViewChange, onFilterOpen, onClearFilter,
  categoryHeading,
}: Props) {
  const { locale, t } = useLanguage();
  const numberLocale = locale === "th" ? "th-TH" : "en-US";

  return (
    <div className="results-bar">
      <div className="results-meta">
        <p className="results-count">
          {isLoading ? t.results.searching : t.results.spacesInBangkok(count)}
        </p>
        <h1 className="results-heading">{categoryHeading}</h1>
      </div>

      <div className="results-controls">
        <select
          className="sort-select"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          aria-label={t.results.sortListings}
        >
          <option value="default">{t.results.sortDefault}</option>
          <option value="price_asc">{t.results.priceLowHigh}</option>
          <option value="price_desc">{t.results.priceHighLow}</option>
          <option value="rating">{t.results.topRated}</option>
        </select>

        <button className="filter-btn" type="button" onClick={onFilterOpen}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          {t.results.filters}
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
        </button>

        <div className="view-toggle" aria-label={t.results.viewMode}>
          {(["split", "list", "map"] as const).map((mode) => (
            <button
              key={mode}
              className={viewMode === mode ? "is-active" : ""}
              onClick={() => onViewChange(mode)}
              type="button"
            >
              {mode === "split" ? t.results.split : mode === "list" ? t.results.list : t.results.map}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="active-filters">
          {filters.priceMin > 0 && (
            <button className="active-filter-chip" type="button" onClick={() => onClearFilter("priceMin")}>
              {t.results.min} ฿{filters.priceMin.toLocaleString(numberLocale)} {t.results.remove}
            </button>
          )}
          {filters.priceMax < 10_000 && (
            <button className="active-filter-chip" type="button" onClick={() => onClearFilter("priceMax")}>
              {t.results.max} ฿{filters.priceMax.toLocaleString(numberLocale)} {t.results.remove}
            </button>
          )}
          {filters.minRating > 0 && (
            <button className="active-filter-chip" type="button" onClick={() => onClearFilter("minRating")}>
              ★ {filters.minRating.toFixed(1)}+ {t.results.remove}
            </button>
          )}
          {filters.amenities.map((amenity) => (
            <button key={amenity} className="active-filter-chip" type="button" onClick={() => onClearFilter("amenities")}>
              {amenity} {t.results.remove}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
