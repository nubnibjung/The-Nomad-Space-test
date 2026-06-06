"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LISTINGS } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";

type WishlistItem = {
  listing_id: string;
  name: string | null;
};

type WishlistResponse = {
  ids?: string[];
  wishlists?: WishlistItem[];
};

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const authMenuRef = useRef<HTMLDivElement | null>(null);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const userInitial = getUserInitial(session?.user?.name ?? session?.user?.email);

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/wishlist", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) {
            setSavedIds([]);
            setWishlistItems([]);
          }
          return;
        }

        const data = (await response.json()) as WishlistResponse;

        if (active) {
          setSavedIds(Array.isArray(data.ids) ? data.ids : []);
          setWishlistItems(Array.isArray(data.wishlists) ? data.wishlists : []);
        }
      } catch (error) {
        console.error("Load wishlist error:", error);

        if (active) {
          setSavedIds([]);
          setWishlistItems([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      const authMenuElement = authMenuRef.current;

      if (!authMenuElement || authMenuElement.contains(event.target as Node)) {
        return;
      }

      setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [menuOpen]);

  const groupedWishlists = useMemo(() => {
    const groups: Record<string, string[]> = {};

    wishlistItems.forEach((item) => {
      const groupName = item.name?.trim() || "Wishlist";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(item.listing_id);
    });

    return groups;
  }, [wishlistItems]);

  const wishlistGroups = useMemo(() => {
    return Object.entries(groupedWishlists)
      .map(([name, ids]) => {
        const listingsInWishlist = ids
          .map((id) => LISTINGS.find((listing) => listing.id === id))
          .filter((listing): listing is (typeof LISTINGS)[number] => Boolean(listing));

        return {
          name,
          count: listingsInWishlist.length,
          coverImage: listingsInWishlist[0]?.images[0] ?? "",
          listings: listingsInWishlist,
        };
      })
      .filter((group) => group.count > 0);
  }, [groupedWishlists]);

  const activeListings = useMemo(() => {
    if (!selectedGroup) return [];

    const ids = groupedWishlists[selectedGroup] ?? [];

    return ids
      .map((id) => LISTINGS.find((listing) => listing.id === id))
      .filter((listing): listing is (typeof LISTINGS)[number] => Boolean(listing));
  }, [selectedGroup, groupedWishlists]);

  return (
    <main className="wishlist-page">
      <header className="top-header wishlist-top-header is-scrolled">
        <nav className="header-inner" aria-label="Wishlist header">
          <Link className="brand" href="/" aria-label="The Nomad Space home">
            <span className="brand-mark" aria-hidden="true" style={{ color: "#000000" }}>
              <svg viewBox="0 0 32 32">
                <path d="M5 25.5V11.2L16 4l11 7.2v14.3h-5.8V14.7L16 11.3l-5.2 3.4v10.8H5Z" />
                <path d="M13.1 25.5V17h5.8v8.5h-5.8Z" />
              </svg>
            </span>
            <span>The Nomad Space</span>
          </Link>

          <div aria-hidden="true" />

          <div className="header-actions">
            <Link className="host-link hide-mobile" href="/auth">
              โหมดโฮสต์
            </Link>

            {session ? (
              <Link className="account-avatar-button" href="/profile" aria-label="Profile">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <strong>{userInitial}</strong>
                )}
              </Link>
            ) : null}

            <div className="auth-menu" ref={authMenuRef}>
              <button
                className="profile-button"
                type="button"
                aria-label={session ? "Account menu" : "Sign in"}
                aria-expanded={menuOpen}
                onClick={() => {
                  if (status === "loading") return;
                  setMenuOpen((value) => !value);
                }}
              >
                <i className="bi bi-list" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="auth-dropdown" role="menu">
                  {session ? (
                    <>
                      <Link
                        className="auth-dropdown-item"
                        href="/wishlist"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <i className="bi bi-heart" aria-hidden="true" />
                        Wishlist
                      </Link>

                      <Link
                        className="auth-dropdown-item"
                        href="/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <i className="bi bi-person" aria-hidden="true" />
                        โปรไฟล์
                      </Link>

                      <hr className="auth-dropdown-divider" />

                      <button
                        className="auth-dropdown-item"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                      >
                        ออกจากระบบ
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        className="auth-dropdown-item"
                        href="/auth"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        เข้าสู่ระบบ / ลงทะเบียน
                      </Link>

                      <Link
                        className="auth-dropdown-item"
                        href="/help"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        ศูนย์ช่วยเหลือ
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <section className="wishlist-content">
        {selectedGroup ? (
          <div className="wishlist-detail-view">
            <button className="wishlist-back-btn" onClick={() => setSelectedGroup(null)}>
              <i className="bi bi-chevron-left" aria-hidden="true" /> กลับไปหน้า Wishlist ทั้งหมด
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
                  <button
                    className="wishlist-card-container"
                    key={group.name}
                    type="button"
                    onClick={() => setSelectedGroup(group.name)}
                  >
                    <span
                      className="wishlist-cover"
                      style={{ backgroundImage: `url("${group.coverImage}")` }}
                    />

                    <strong>{group.name}</strong>
                    <small>บันทึกไว้ {group.count.toLocaleString("th-TH")} รายการ</small>
                  </button>
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

function getUserInitial(value?: string | null) {
  if (!value) return "?";

  return value.trim().charAt(0).toUpperCase();
}