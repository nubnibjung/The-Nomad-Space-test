"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const EASE = "cubic-bezier(0.2, 0, 0, 1)";

type Props = {
  listing: Listing;
  isActive: boolean;
  isSaved: boolean;
  variant?: "stay" | "experience";
  badgeLabel?: string;
  onHover: (id: string | null) => void;
  onSave: (id: string) => void;
  onSelect: (listing: Listing) => void;
};

export function ListingCard({
  listing,
  isActive,
  isSaved,
  variant = "stay",
  badgeLabel,
  onHover,
  onSave,
  onSelect,
}: Props) {
  const { locale, t } = useLanguage();
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isExperience = variant === "experience";
  const effectiveBadgeLabel = badgeLabel ?? t.listing.guestFavorite;

  function next() { setImageIndex((i) => (i + 1) % listing.images.length); }
  function prev() { setImageIndex((i) => (i - 1 + listing.images.length) % listing.images.length); }

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const d = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(d) < 30) return;
    if (d < 0) {
      next();
      return;
    }
    prev();
  }

  return (
    <article
      className={`listing-card${isActive ? " is-active" : ""}`}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="card-media-wrap">
      {/* Image carousel */}
      <button className="card-media" onClick={() => onSelect(listing)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} type="button">
        <div
          className="image-strip"
          style={{ transform: `translateX(-${imageIndex * 100}%)`, transitionTimingFunction: EASE }}
        >
          {listing.images.map((src) => (
            <span
              key={src}
              className="listing-image"
              style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.18)),url("${src}")` }}
            />
          ))}
        </div>
      </button>

      {(isExperience || listing.rating >= 4.9) && (
        <span className="guest-badge">{effectiveBadgeLabel}</span>
      )}

      {/* Heart */}
      <button
        className={`heart-button${isSaved ? " is-saved" : ""}`}
        type="button"
        aria-label={`${isSaved ? t.listing.unsave : t.listing.save} ${listing.title}`}
        onClick={(e) => { e.stopPropagation(); onSave(listing.id); }}
      >
        <i className={`bi ${isSaved ? "bi-heart-fill" : "bi-heart"}`} aria-hidden="true" />
      </button>

      {/* Carousel arrows */}
      {imageIndex > 0 && (
        <button className="carousel-control previous" onClick={(e) => { e.stopPropagation(); prev(); }} type="button" aria-label={t.listing.previousImage}>
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>
      )}
      {imageIndex < listing.images.length - 1 && (
        <button className="carousel-control next" onClick={(e) => { e.stopPropagation(); next(); }} type="button" aria-label={t.listing.nextImage}>
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      )}

      {/* Dots */}
      <div className="image-dots" aria-hidden="true">
        {listing.images.map((src, i) => (
          <span key={src} className={i === imageIndex ? "is-active" : ""}/>
        ))}
      </div>
      </div>

      {/* Info */}
      <button className="card-copy" onClick={() => onSelect(listing)} type="button">
        <span className="card-title-row">
          <strong>{listing.title}</strong>
          <span className={`rating${isExperience ? " is-experience-rating" : ""}`}>
            <i className="bi bi-star-fill star-svg" aria-hidden="true" />
            {listing.rating}
          </span>
        </span>

        <p>
          <b>{formatPrice(listing.pricePerNight, locale)}</b> {isExperience ? `/ คน · ★ ${listing.rating}` : t.listing.priceForTwoNights}
        </p>
      </button>
    </article>
  );
}
