"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LISTINGS } from "@/lib/data";

export default function WishlistPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/wishlist")
      .then((response) => (response.ok ? response.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => {
        if (active) setSavedIds(data.ids ?? []);
      })
      .catch(() => {
        if (active) setSavedIds([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const savedListings = useMemo(
    () => savedIds
      .map((id) => LISTINGS.find((listing) => listing.id === id))
      .filter((listing): listing is (typeof LISTINGS)[number] => Boolean(listing)),
    [savedIds],
  );

  return (
    <main className="wishlist-page">
      <header className="wishlist-header">
        <Link className="wishlist-brand" href="/" aria-label="The Nomad Space home">
          <span className="wishlist-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M5 25.5V11.2L16 4l11 7.2v14.3h-5.8V14.7L16 11.3l-5.2 3.4v10.8H5Z" />
              <path d="M13.1 25.5V17h5.8v8.5h-5.8Z" />
            </svg>
          </span>
          <span>The Nomad Space</span>
        </Link>

        <div className="wishlist-actions">
          <Link href="/auth">โหมดโฮสต์</Link>
          <button type="button" aria-label="Profile">
            <span>P</span>
          </button>
          <button type="button" aria-label="Menu">
            <i className="bi bi-list" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="wishlist-content">
        <h1>Wishlist</h1>

        {isLoading ? (
          <div className="wishlist-empty">
            <h2>กำลังโหลดรายการที่บันทึกไว้</h2>
          </div>
        ) : savedListings.length > 0 ? (
          <div className="wishlist-grid">
            {savedListings.map((listing, index) => (
              <Link className="wishlist-card" href={`/listings/${listing.id}`} key={listing.id}>
                <span
                  className="wishlist-cover"
                  style={{ backgroundImage: `url("${listing.images[0]}")` }}
                />
                <strong>{index + 1}</strong>
                <small>บันทึกไว้ {savedListings.length.toLocaleString("th-TH")} รายการ</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="wishlist-empty">
            <h2>ยังไม่มีรายการที่บันทึกไว้</h2>
            <p>กดหัวใจบนที่พักหรือบริการที่ชอบ แล้วรายการจะมาแสดงที่นี่</p>
            <Link href="/">เริ่มค้นหา</Link>
          </div>
        )}
      </section>
    </main>
  );
}
