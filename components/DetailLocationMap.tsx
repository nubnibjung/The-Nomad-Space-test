"use client";

import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Listing } from "@/lib/types";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

type Props = {
  listing: Listing;
};

export default function DetailLocationMap({ listing }: Props) {
  return (
    <Map
      initialViewState={{
        longitude: listing.lng,
        latitude: listing.lat,
        zoom: 13.8,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
      dragPan={false}
      dragRotate={false}
      scrollZoom={false}
      doubleClickZoom={false}
      touchZoomRotate={false}
      keyboard={false}
    >
      <Marker longitude={listing.lng} latitude={listing.lat} anchor="center">
        <span className="detail-real-map-marker" aria-label={listing.title}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" />
          </svg>
        </span>
      </Marker>
    </Map>
  );
}
