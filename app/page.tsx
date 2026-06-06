"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDiscovery } from "@/hooks/useDiscovery";
import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { MapPanel } from "@/components/MapPanel";
import { FilterModal } from "@/components/FilterModal";
import { SkeletonGrid } from "@/components/SkeletonGrid";
import { EmptyState } from "@/components/EmptyState";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { useLanguage } from "@/lib/i18n";
import { LISTINGS } from "@/lib/data";
import type { Listing } from "@/lib/types";

type RowScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

type ListingSection = {
  title: string;
  subtitle?: string;
  listings: Listing[];
  variant?: "stay" | "experience";
  badgeLabel?: string;
};

export default function DiscoveryPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useLanguage();
  const [welcomeName, setWelcomeName] = useState(() => {
    if (typeof window === "undefined") return "";
    const storedName = window.sessionStorage.getItem("nomad-welcome-name");
    if (storedName) window.sessionStorage.removeItem("nomad-welcome-name");
    return storedName ?? "";
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [resultsSection, setResultsSection] = useState<ListingSection | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [wishlistPendingId, setWishlistPendingId] = useState<string | null>(null);
  const [wishlistNameInput, setWishlistNameInput] = useState("");
  const {
    query, handleQueryChange,
    activeCategory, handleCategoryChange,
    dateRange, handleDateChange,
    dateFlexIndex, handleDateFlexChange,
    guestCounts, handleGuestChange, handleGuestReset,
    bounds, handleBoundsChange,
    filters, handleFiltersApply,
    handleSearchReset,
    userLocation,
    handleNearby,
    listings, isLoading,
    hoveredId, setHoveredId,
    selectedId, selectedListing, handleListingSelect,
    isSearchOpen, setIsSearchOpen,
    isFilterOpen, setIsFilterOpen,
    isScrolled,
    savedIds, handleSaveToggle,
  } = useDiscovery();
  const sections = buildListingSections(listings.length > 0 ? listings : LISTINGS, activeCategory, serviceType);
  const activeResultsSection = resultsSection
    ? {
        ...resultsSection,
        listings: sections.find((section) => section.title === resultsSection.title)?.listings ?? resultsSection.listings,
      }
    : null;

  useEffect(() => {
    if (!welcomeName) return;
    const timerId = window.setTimeout(() => setWelcomeName(""), 4200);
    return () => window.clearTimeout(timerId);
  }, [welcomeName]);

  function renderHomeContent() {
    if (isLoading && listings.length === 0) return <SkeletonGrid/>;
    if (listings.length === 0) return <EmptyState onReset={handleSearchReset}/>;
    if (activeResultsSection) {
      return (
        <ResultsView
          section={activeResultsSection}
          activeCategory={activeCategory}
          hoveredId={hoveredId}
          savedIds={savedIds}
          onHover={setHoveredId}
          onSave={handleProtectedSave}
          onBack={() => setResultsSection(null)}
          onSelect={(listing) => {
            handleListingSelect(listing);
            router.push(`/listings/${listing.id}`);
          }}
        />
      );
    }

    return sections.map((section) => (
      <HomeSection
        key={section.title}
        section={section}
        hoveredId={hoveredId}
        savedIds={savedIds}
        onHover={setHoveredId}
        onSave={handleProtectedSave}
        onOpenResults={setResultsSection}
        onSelect={(listing) => {
          handleListingSelect(listing);
          router.push(`/listings/${listing.id}`);
        }}
        previousLabel={t.home.previous}
        nextLabel={t.home.next}
      />
    ));
  }

  function handleProtectedSave(id: string) {
    if (status === "authenticated") {
      if (savedIds.has(id)) {
        handleSaveToggle(id);
      } else {
        setWishlistPendingId(id);
        setWishlistNameInput("");
      }
      return;
    }

    setAuthPromptOpen(true);
  }

  return (
    <main className={`discovery-shell${activeCategory === "loft" ? " is-experience" : ""}${isSearchOpen && !isScrolled && activeCategory !== "loft" ? " is-search-expanded" : ""}`}>
      {welcomeName && <WelcomeToast name={welcomeName} label={t.auth.welcome} />}

      <Header
        query={query}
        activeCategory={activeCategory}
        dateRange={dateRange}
        dateFlexIndex={dateFlexIndex}
        guestCounts={guestCounts}
        isSearchOpen={isSearchOpen}
        isScrolled={isScrolled}
        onQueryChange={handleQueryChange}
        onCategoryChange={(id) => {
          setResultsSection(null);
          setServiceType(null);
          handleCategoryChange(id);
        }}
        onDateChange={handleDateChange}
        onDateFlexChange={handleDateFlexChange}
        onGuestChange={handleGuestChange}
        onGuestReset={handleGuestReset}
        onSearchOpen={setIsSearchOpen}
        onSearchReset={() => handleSearchReset({ keepSearchOpen: true })}
        onNearby={handleNearby}
        serviceType={serviceType}
        onServiceChange={setServiceType}
      />

      <section className={`nomad-layout${isMapVisible ? "" : " is-map-hidden"}`} aria-live="polite">
        {activeResultsSection && (
          <ResultsFilterRow
            activeCategory={activeCategory}
            onFilterOpen={() => setIsFilterOpen(true)}
          />
        )}

        <div className="nomad-home">
          {!isMapVisible && (
            <button className="map-show-button" type="button" onClick={() => setIsMapVisible(true)}>
              <i className="bi bi-map" aria-hidden="true" />
              {t.map.showMap}
            </button>
          )}
          {renderHomeContent()}
        </div>

        {isMapVisible && (
          <MapPanel
            listings={listings}
            bounds={bounds}
            isLoading={isLoading}
            hoveredId={hoveredId}
            selectedId={selectedId}
            selectedListing={selectedListing}
            isDark={false}
            userLocation={userLocation}
            onHover={setHoveredId}
            onSelect={(listing) => {
              handleListingSelect(listing);
              router.push(`/listings/${listing.id}`);
            }}
            onBoundsChange={handleBoundsChange}
            onHide={() => {
              setIsMapVisible(false);
              handleSearchReset();
            }}
          />
        )}
      </section>

      {isFilterOpen && (
        <FilterModal
          filters={filters}
          onApply={handleFiltersApply}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {authPromptOpen && <AuthPromptModal onClose={() => setAuthPromptOpen(false)} />}

      {wishlistPendingId && (
        <div className="wishlist-modal-overlay" onClick={() => setWishlistPendingId(null)}>
          <div className="wishlist-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wishlist-modal-header">
              <button className="wishlist-modal-back" onClick={() => setWishlistPendingId(null)} aria-label="Back">
                <i className="bi bi-chevron-left" />
              </button>
              <h2>สร้าง Wishlist</h2>
              <div style={{ width: "32px" }} />
            </div>

            <div className="wishlist-modal-body">
              <div className="wishlist-form-group">
                <input
                  type="text"
                  maxLength={50}
                  className="wishlist-form-input"
                  value={wishlistNameInput}
                  onChange={(e) => setWishlistNameInput(e.target.value)}
                  placeholder="ชื่อ"
                  autoFocus
                />
                <span className="wishlist-char-count">{wishlistNameInput.length}/50 อักขระ</span>
              </div>
            </div>

            <div className="wishlist-modal-footer">
              <button className="wishlist-btn-text" onClick={() => setWishlistPendingId(null)}>
                ยกเลิก
              </button>
              <button
                className="wishlist-btn-submit"
                disabled={!wishlistNameInput.trim()}
                onClick={() => {
                  if (wishlistNameInput.trim()) {
                    handleSaveToggle(wishlistPendingId, wishlistNameInput.trim());
                    setWishlistPendingId(null);
                  }
                }}
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function WelcomeToast({ name, label }: { name: string; label: string }) {
  return (
    <div className="welcome-toast" role="status" aria-live="polite">
      <span className="welcome-toast-icon" aria-hidden="true">
        <i className="bi bi-check-lg" aria-hidden="true" />
      </span>
      <strong>{label} {name}</strong>
    </div>
  );
}

type HomeSectionProps = {
  section: ListingSection;
  hoveredId: string | null;
  savedIds: Set<string>;
  onHover: (id: string | null) => void;
  onSave: (id: string) => void;
  onOpenResults: (section: ListingSection) => void;
  onSelect: (listing: Listing) => void;
  previousLabel: string;
  nextLabel: string;
};

function HomeSection({ section, hoveredId, savedIds, onHover, onSave, onOpenResults, onSelect, previousLabel, nextLabel }: HomeSectionProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [scrollState, setScrollState] = useState<RowScrollState>({
    canScrollLeft: false,
    canScrollRight: true,
  });

  const updateScrollState = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    const nextState = {
      canScrollLeft: row.scrollLeft > 1,
      canScrollRight: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
    };

    setScrollState((current) => {
      if (
        current.canScrollLeft === nextState.canScrollLeft &&
        current.canScrollRight === nextState.canScrollRight
      ) {
        return current;
      }

      return nextState;
    });
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(frameId);
  }, [section.listings.length, updateScrollState]);

  function scheduleScrollStateUpdate() {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateScrollState();
    });
  }

  function scrollListingRow(direction: "left" | "right") {
    const row = rowRef.current;
    if (!row) return;

    const scrollAmount = Math.max(row.clientWidth * 0.85, 280);
    row.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <section className="home-section">
      <div className="section-heading-row">
        <div className="section-title-copy">
          <h1>{section.title}</h1>
          {section.subtitle && <p>{section.subtitle}</p>}
        </div>
        <button
          className="section-title-arrow"
          type="button"
          aria-label={`${section.title} ${nextLabel}`}
          onClick={() => onOpenResults(section)}
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
        <div className="section-nav">
          <button
            type="button"
            aria-label={previousLabel}
            onClick={() => scrollListingRow("left")}
            disabled={!scrollState.canScrollLeft}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => scrollListingRow("right")}
            disabled={!scrollState.canScrollRight}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="listing-row"
        ref={rowRef}
        onScroll={scheduleScrollStateUpdate}
      >
        {section.listings.map((listing, index) => (
          <ListingCard
            key={`${section.title}-${listing.id}-${index}`}
            listing={listing}
            isActive={listing.id === hoveredId}
            isSaved={savedIds.has(listing.id)}
            variant={section.variant}
            badgeLabel={section.badgeLabel}
            onHover={onHover}
            onSave={onSave}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

type ResultsViewProps = {
  section: ListingSection;
  activeCategory: string;
  hoveredId: string | null;
  savedIds: Set<string>;
  onFilterOpen?: () => void;
  onHover: (id: string | null) => void;
  onSave: (id: string) => void;
  onBack: () => void;
  onSelect: (listing: Listing) => void;
};

function ResultsFilterRow({
  activeCategory,
  onFilterOpen,
}: {
  activeCategory: string;
  onFilterOpen: () => void;
}) {
  const filters = activeCategory === "loft"
    ? ["ช่วงเวลา", "เหมาะกับครอบครัว", "อาหาร", "วัฒนธรรม", "กลางแจ้ง", "ยอดนิยม"]
    : ["เช็คอินด้วยตนเอง", "Wi‑Fi", "จองทันที", "เครื่องซักผ้า", "เครื่องปรับอากาศ", "ที่จอดรถฟรี", "สระ", "ทีวี", "ครัว"];

  return (
    <div className="results-filter-row" aria-label="ตัวกรองผลลัพธ์">
      <button className="results-filter-chip is-filter" type="button" onClick={onFilterOpen}>
        <i className="bi bi-sliders" aria-hidden="true" />
        ตัวกรอง
      </button>
      {filters.map((filter) => (
        <button className="results-filter-chip" type="button" key={filter}>
          {filter}
        </button>
      ))}
    </div>
  );
}

function ResultsView({
  section,
  activeCategory,
  hoveredId,
  savedIds,
  onFilterOpen,
  onHover,
  onSave,
  onBack,
  onSelect,
}: ResultsViewProps) {
  const resultTypeLabel = activeCategory === "loft" ? "เอ็กซ์พีเรียนซ์" : activeCategory === "coffee" ? "บริการ" : "ที่พัก";
  const filters = activeCategory === "loft"
    ? ["ช่วงเวลา", "เหมาะกับครอบครัว", "อาหาร", "วัฒนธรรม", "กลางแจ้ง", "ยอดนิยม"]
    : ["เช็คอินด้วยตนเอง", "Wi‑Fi", "จองทันที", "เครื่องซักผ้า", "เครื่องปรับอากาศ", "ที่จอดรถฟรี", "สระ", "ทีวี", "ครัว"];

  return (
    <div className="results-view">
      <div className="results-filter-row" aria-label="ตัวกรองผลลัพธ์">
        <button className="results-filter-chip is-filter" type="button" onClick={onFilterOpen}>
          <i className="bi bi-sliders" aria-hidden="true" />
          ตัวกรอง
        </button>
        {filters.map((filter) => (
          <button className="results-filter-chip" type="button" key={filter}>
            {filter}
          </button>
        ))}
      </div>

      <div className="results-heading-row">
        <div>
          <p>{section.subtitle ?? "ราคาค่าธรรมเนียมทั้งหมด"}</p>
          <h1>{resultTypeLabel}กว่า {Math.max(section.listings.length * 140, 1000).toLocaleString("th-TH")} แห่ง</h1>
        </div>
        <button className="results-back-button" type="button" onClick={onBack}>
          กลับ
        </button>
      </div>

      <div className="results-grid">
        {section.listings.map((listing, index) => (
          <ListingCard
            key={`results-${section.title}-${listing.id}-${index}`}
            listing={listing}
            isActive={listing.id === hoveredId}
            isSaved={savedIds.has(listing.id)}
            variant={section.variant}
            badgeLabel={section.badgeLabel}
            onHover={onHover}
            onSave={onSave}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function buildListingSections(listings: Listing[], activeCategory: string, serviceType: string | null = null) {
  if (listings.length === 0) return [];

  const sectionListings =
    activeCategory === "loft" ? buildExperienceListings(listings)
    : activeCategory === "coffee" ? buildServiceListings(listings, serviceType)
    : listings;
  const filledListings = fillListingRow(sectionListings, 7);
  const areaName = getDominantAreaName(listings);
  const sectionCopy = getSectionCopy(activeCategory, areaName);

  return sectionCopy.map((section, index) => ({
    ...section,
    listings: rotateListings(filledListings, index * 3),
  }));
}

const EXPERIENCE_CARD_CONTENT = [
  {
    title: "ห้ามพลาด: ทัวร์ปั่นจักรยานและชิมอาหารในบางกอกที่ซ่อนอยู่",
    neighborhood: "Bangkok, ไทย",
    pricePerNight: 1850,
    images: [
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "เรียนทำอาหารไทยแท้กับเชฟท้องถิ่น",
    neighborhood: "Ari, ไทย",
    pricePerNight: 1300,
    images: [
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "สนุกสุดเหวี่ยงในบางกอกยามค่ำคืน 4 สถานที่พร้อมเพื่อนใหม่",
    neighborhood: "Thong Lo, ไทย",
    pricePerNight: 1280,
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "ค่ำคืนที่น่าจดจำในกรุงเทพฯ",
    neighborhood: "Sukhumvit, ไทย",
    pricePerNight: 1400,
    images: [
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "ล่องคลองกรุงเทพบนเรือยาว",
    neighborhood: "Thon Buri, ไทย",
    pricePerNight: 1150,
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "เรื่องผีในกรุงเทพ",
    neighborhood: "Rattanakosin, ไทย",
    pricePerNight: 1000,
    images: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "การเดินทางสัมผัสอาหารในตำนานของไชน่าทาวน์กรุงเทพฯ",
    neighborhood: "Yaowarat, ไทย",
    pricePerNight: 2051,
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    title: "เรียนรำไทยและพิธีมงคลในบ้านศิลปิน",
    neighborhood: "Phra Nakhon, ไทย",
    pricePerNight: 1600,
    images: [
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    ],
  },
];

function buildExperienceListings(listings: Listing[]) {
  return listings.map((listing, index) => {
    const content = EXPERIENCE_CARD_CONTENT[index % EXPERIENCE_CARD_CONTENT.length];

    return {
      ...listing,
      title: content.title,
      neighborhood: content.neighborhood,
      pricePerNight: content.pricePerNight,
      images: content.images,
    };
  });
}

const SERVICE_CARD_CONTENT = [
  {
    serviceType: "photography",
    title: "ช่างภาพมืออาชีพ ถ่ายโปรไฟล์และอีเวนต์",
    neighborhood: "Bangkok, ไทย",
    pricePerNight: 1500,
    images: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1606986628253-05620e9b1c43?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "chef",
    title: "เชฟส่วนตัว ทำอาหารถึงที่พัก",
    neighborhood: "Ari, ไทย",
    pricePerNight: 2200,
    images: [
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "massage",
    title: "นวดผ่อนคลายสไตล์ไทย ถึงห้องพัก",
    neighborhood: "Thong Lo, ไทย",
    pricePerNight: 1200,
    images: [
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "meals",
    title: "อาหารปรุงสำเร็จพร้อมเสิร์ฟจากครัวท้องถิ่น",
    neighborhood: "Sukhumvit, ไทย",
    pricePerNight: 850,
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "fitness",
    title: "เทรนเนอร์ส่วนตัว ออกกำลังกายถึงที่",
    neighborhood: "Sathorn, ไทย",
    pricePerNight: 1100,
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "makeup",
    title: "ช่างแต่งหน้ามืออาชีพ สำหรับทุกโอกาส",
    neighborhood: "Siam, ไทย",
    pricePerNight: 1600,
    images: [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "hair",
    title: "ช่างทำผมถึงที่พัก ก่อนงานสำคัญ",
    neighborhood: "Phrom Phong, ไทย",
    pricePerNight: 1300,
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "spa",
    title: "ทรีตเมนต์สปาครบวงจร ในที่พัก",
    neighborhood: "Riverside, ไทย",
    pricePerNight: 1900,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    serviceType: "catering",
    title: "บริการจัดเลี้ยง สำหรับงานและทีม",
    neighborhood: "Yaowarat, ไทย",
    pricePerNight: 2600,
    images: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
    ],
  },
];

function buildServiceListings(listings: Listing[], serviceType: string | null) {
  const matched = serviceType
    ? SERVICE_CARD_CONTENT.filter((service) => service.serviceType === serviceType)
    : SERVICE_CARD_CONTENT;
  const content = matched.length > 0 ? matched : SERVICE_CARD_CONTENT;

  return content.map((service, index) => {
    const base = listings[index % listings.length];

    return {
      ...base,
      id: `svc_${service.serviceType}_${index}`,
      title: service.title,
      neighborhood: service.neighborhood,
      pricePerNight: service.pricePerNight,
      images: service.images,
    };
  });
}

function getSectionCopy(activeCategory: string, areaName: string) {
  const displayAreaName = areaName === "Bangkok" ? "กรุงเทพมหานคร" : areaName;

  if (activeCategory === "loft") {
    return [
      { title: `เอ็กซ์พีเรียนซ์ยอดนิยมใน${displayAreaName}`, variant: "experience" as const, badgeLabel: "ยอดนิยม" },
      { title: "Nomad ออริจินัล", subtitle: "โฮสต์โดยผู้คนที่น่าสนใจที่สุดในโลก", variant: "experience" as const, badgeLabel: "ออริจินัล" },
    ];
  }

  if (activeCategory === "coffee") {
    return [
      { title: `บริการยอดนิยมใน${displayAreaName}` },
      { title: "บริการแนะนำ", subtitle: "ค้นหาบริการจากโฮสต์ที่ไว้ใจได้" },
    ];
  }

  return [
    { title: `ที่พักยอดนิยมใน${displayAreaName}` },
    { title: `ว่างเดือนหน้าใน${displayAreaName}` },
  ];
}

function getDominantAreaName(listings: Listing[]) {
  const areaCounts = listings.reduce<Map<string, number>>((counts, listing) => {
    const areaName = getListingAreaName(listing);
    counts.set(areaName, (counts.get(areaName) ?? 0) + 1);
    return counts;
  }, new Map());

  return [...areaCounts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] ?? "บริเวณนี้";
}

function getListingAreaName(listing: Listing) {
  const parts = listing.neighborhood.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? listing.neighborhood;
}

function fillListingRow(listings: Listing[], minimumCount: number): Listing[] {
  if (listings.length >= minimumCount) return listings;
  if (listings.length < 3) return listings;
  return Array.from({ length: minimumCount }, (_, index) => listings[index % listings.length]);
}

function rotateListings(listings: Listing[], offset: number): Listing[] {
  const start = offset % listings.length;
  return [...listings.slice(start), ...listings.slice(0, start)];
}
