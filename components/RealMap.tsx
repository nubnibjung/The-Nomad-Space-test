"use client";

import { useCallback, useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Bounds, Listing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const STYLE_DARK  = "https://tiles.openfreemap.org/styles/positron"; // inverted via CSS

const INIT = { longitude: 100.568, latitude: 13.745, zoom: 11.2 };

type Props = {
  listings: Listing[];
  bounds: Bounds;
  hoveredId: string | null;
  selectedId: string | null;
  isDark: boolean;
  userLocation: { lat: number; lng: number } | null;
  onHover: (id: string | null) => void;
  onSelect: (listing: Listing) => void;
  onBoundsChange: (b: Bounds) => void;
  onVisibleListingCountChange: (count: number) => void;
};

export default function RealMap({
  listings, bounds, hoveredId, selectedId, isDark, userLocation,
  onHover, onSelect, onBoundsChange, onVisibleListingCountChange,
}: Props) {
  const listingsRef = useRef(listings);
  const mapRef = useRef<MapRef>(null);
  const mapReportedBoundsRef = useRef<Bounds[]>([]);
  const isUserInteractingRef = useRef(false);
  const viewportUpdateFrameRef = useRef<number | null>(null);

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (consumeMapReportedBounds(bounds, mapReportedBoundsRef.current)) {
      return;
    }

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      {
        padding: 72,
        duration: 650,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      },
    );
  }, [bounds]);

  // Fly to selected listing
  useEffect(() => {
    const listing = listings.find((l) => l.id === selectedId);
    if (!listing || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [listing.lng, listing.lat],
      duration: 900,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  }, [listings, selectedId]);

  // Fly to user GPS location when it changes
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14.5,
      duration: 1400,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  }, [userLocation]);

  const handleViewportChange = useCallback((shouldUpdateBounds = true) => {
    const map = mapRef.current;
    if (!map) return;
    if (shouldUpdateBounds && !isUserInteractingRef.current) return;

    const b = map.getBounds();
    if (!b) return;

    onVisibleListingCountChange(
      listingsRef.current.filter((listing) => (
        listing.lat <= b.getNorth() &&
        listing.lat >= b.getSouth() &&
        listing.lng <= b.getEast() &&
        listing.lng >= b.getWest()
      )).length,
    );

    if (shouldUpdateBounds) {
      const nextBounds = {
        north: b.getNorth(),
        south: b.getSouth(),
        east:  b.getEast(),
        west:  b.getWest(),
      };

      mapReportedBoundsRef.current = [nextBounds, ...mapReportedBoundsRef.current].slice(0, 8);
      onBoundsChange(nextBounds);
    }
  }, [onBoundsChange, onVisibleListingCountChange]);

  const scheduleViewportChange = useCallback((shouldUpdateBounds = true) => {
    if (viewportUpdateFrameRef.current !== null) return;

    viewportUpdateFrameRef.current = window.requestAnimationFrame(() => {
      viewportUpdateFrameRef.current = null;
      handleViewportChange(shouldUpdateBounds);
    });
  }, [handleViewportChange]);

  useEffect(() => (
    () => {
      if (viewportUpdateFrameRef.current !== null) {
        window.cancelAnimationFrame(viewportUpdateFrameRef.current);
      }
    }
  ), []);

  return (
    <div className={isDark ? "map-dark" : ""} style={{ width: "100%", height: "100%" }}>
    <Map
      ref={mapRef}
      initialViewState={INIT}
      style={{ width: "100%", height: "100%" }}
      mapStyle={isDark ? STYLE_DARK : STYLE_LIGHT}
      onMove={() => scheduleViewportChange(true)}
      onMoveEnd={() => {
        handleViewportChange(true);
        isUserInteractingRef.current = false;
      }}
      onDragStart={() => { isUserInteractingRef.current = true; }}
      onZoomStart={() => { isUserInteractingRef.current = true; }}
      onLoad={() => handleViewportChange(false)}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <div className="user-location-dot" aria-label="Your location">
            <div className="user-location-pulse" />
          </div>
        </Marker>
      )}

      {listings.map((listing) => {
        const isActive = listing.id === selectedId || listing.id === hoveredId;
        return (
          <Marker
            key={listing.id}
            longitude={listing.lng}
            latitude={listing.lat}
            anchor="bottom"
            offset={[0, 5]}
          >
            <button
              className={`map-marker${isActive ? " is-active" : ""}`}
              onClick={() => onSelect(listing)}
              onMouseEnter={() => onHover(listing.id)}
              onMouseLeave={() => onHover(null)}
              type="button"
            >
              {formatPrice(listing.pricePerNight)}
            </button>
          </Marker>
        );
      })}
    </Map>
    </div>
  );
}

function consumeMapReportedBounds(bounds: Bounds, reportedBounds: Bounds[]) {
  const index = reportedBounds.findIndex((reported) => isSameBounds(bounds, reported));
  if (index === -1) return false;

  reportedBounds.splice(index, 1);
  return true;
}

function isSameBounds(first: Bounds, second: Bounds) {
  return (
    Math.abs(first.north - second.north) < 0.000001 &&
    Math.abs(first.south - second.south) < 0.000001 &&
    Math.abs(first.east - second.east) < 0.000001 &&
    Math.abs(first.west - second.west) < 0.000001
  );
}
