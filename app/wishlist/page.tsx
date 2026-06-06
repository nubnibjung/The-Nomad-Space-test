"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LISTINGS } from "@/lib/data";

type WishlistItem = {
  listing_id: string;
  name: string;
};

export default function WishlistPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/wishlist")
      .then((response) => (response.ok ? response.json() : { ids: [], wishlists: [] }))
      .then((data: { ids?: string[]; wishlists?: WishlistItem[] }) => {
        if (active) {
          setSavedIds(data.ids ?? []);
          setWishlistItems(data.wishlists ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setSavedIds([]);
          setWishlistItems([]);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const groupedWishlists = useMemo(() => {
    const groups: { [name: string]: string[] } = {};
    wishlistItems.forEach((item) => {
      if (!groups[item.name]) {
        groups[item.name] = [];
      }
      groups[item.name].push(item.listing_id);
    });
    return groups;
  }, [wishlistItems]);

  const wishlistGroups = useMemo(() => {
    return Object.entries(groupedWishlists).map(([name, ids]) => {
      const listingsInWishlist = ids
        .map((id) => LISTINGS.find((listing) => listing.id === id))
        .filter((l): l is (typeof LISTINGS)[number] => Boolean(l));

      const coverImage = listingsInWishlist[0]?.images[0] || "";
      
      return {
        name,
        count: listingsInWishlist.length,
        coverImage,
        listings: listingsInWishlist,
      };
    }).filter(group => group.count > 0);
  }, [groupedWishlists]);

  const activeListings = useMemo(() => {
    if (!selectedGroup) return [];
    const ids = groupedWishlists[selectedGroup] || [];
    return ids
      .map((id) => LISTINGS.find((l) => l.id === id))
      .filter((l): l is (typeof LISTINGS)[number] => Boolean(l));
  }, [selectedGroup, groupedWishlists]);

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
        {selectedGroup ? (
          <div className="wishlist-detail-view">
            <button className="wishlist-back-btn" onClick={() => setSelectedGroup(null)}>
              <i className="bi bi-chevron-left" /> กลับไปหน้า Wishlist ทั้งหมด
            </button>
            <h1 className="wishlist-group-title">{selectedGroup}</h1>

            {activeListings.length > 0 ? (
              <div className="wishlist-listings-grid">
                {activeListings.map((listing) => (
                  <Link className="wishlist-listing-card" href={`/listings/${listing.id}`} key={listing.id}>
                    <span
                      className="wishlist-listing-cover"
                      style={{ backgroundImage: `url("${listing.images[0]}")` }}
                    />
                    <div className="wishlist-listing-info">
                      <strong>{listing.title}</strong>
                      <p>{listing.neighborhood}</p>
                      <span>฿{listing.pricePerNight.toLocaleString("th-TH")} / คืน</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="wishlist-empty">
                <h2>ไม่พบรายการในกลุ่มนี้</h2>
              </div>
            )}
          </div>
        ) : (
          <>
            <h1>Wishlist</h1>

            {isLoading ? (
              <div className="wishlist-empty">
                <h2>กำลังโหลดรายการที่บันทึกไว้</h2>
              </div>
            ) : wishlistGroups.length > 0 ? (
              <div className="wishlist-grid">
                {wishlistGroups.map((group) => (
                  <div
                    className="wishlist-card-container"
                    key={group.name}
                    onClick={() => setSelectedGroup(group.name)}
                    style={{ cursor: "pointer" }}
                  >
                    <span
                      className="wishlist-cover"
                      style={{ backgroundImage: `url("${group.coverImage}")` }}
                    />
                    <strong>{group.name}</strong>
                    <small>บันทึกไว้ {group.count.toLocaleString("th-TH")} รายการ</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="wishlist-empty">
                <h2>ยังไม่มีรายการที่บันทึกไว้</h2>
                <p>กดหัวใจบนที่พักหรือบริการที่ชอบ แล้วรายการจะมาแสดงที่นี่</p>
                <Link href="/">เริ่มค้นหา</Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
