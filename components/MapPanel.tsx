"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Bounds, Listing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const RealMap = dynamic(() => import("./RealMap"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-loading-spinner"/>
    </div>
  ),
});

type Props = {
  listings: Listing[];
  bounds: Bounds;
  isLoading: boolean;
  hoveredId: string | null;
  selectedId: string | null;
  selectedListing: Listing | null;
  isDark: boolean;
  userLocation: { lat: number; lng: number } | null;
  onHover: (id: string | null) => void;
  onSelect: (listing: Listing) => void;
  onBoundsChange: (b: Bounds) => void;
  onHide: () => void;
};

export function MapPanel({
  listings, bounds, isLoading,
  hoveredId, selectedId, selectedListing,
  isDark, userLocation, onHover, onSelect, onBoundsChange, onHide,
}: Props) {
  const { locale, t } = useLanguage();
  const [visibleListingCount, setVisibleListingCount] = useState(listings.length);

  const handleBoundsChange = useCallback((bounds: Bounds) => {
    onBoundsChange(bounds);
  }, [onBoundsChange]);

  const statusText = isLoading
    ? t.map.loading
    : t.map.placesInArea(Math.max(visibleListingCount, listings.length));

  return (
    <aside className="map-panel" aria-label={t.map.label}>
      <div className="map-surface">
        <button className="map-hide-button" type="button" onClick={onHide}>
          <i className="bi bi-eye-slash" aria-hidden="true" />
          {t.map.hideMap}
        </button>

        <RealMap
          listings={listings}
          bounds={bounds}
          hoveredId={hoveredId}
          selectedId={selectedId}
          isDark={isDark}
          userLocation={userLocation}
          onHover={onHover}
          onSelect={onSelect}
          onBoundsChange={handleBoundsChange}
          onVisibleListingCountChange={setVisibleListingCount}
        />

        <div className="map-status">
          <span className="map-status-label">{statusText}</span>
        </div>
      </div>

      {selectedListing && (
        <div className="map-selected-card">
          <strong>{selectedListing.title}</strong>
          <span>{selectedListing.neighborhood}</span>
          <span className="map-selected-price">
            {formatPrice(selectedListing.pricePerNight, locale)}<em>{t.map.perDay}</em>
          </span>
        </div>
      )}
    </aside>
  );
}
