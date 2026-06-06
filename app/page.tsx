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
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [resultsSection, setResultsSection] = useState<ListingSection | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const {
    query, handleQueryChange,
    activeCategory, handleCategoryChange,
    selectedDate, handleDateChange,
    guestCounts, handleGuestChange,
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
  const sections = buildListingSections(listings.length > 0 ? listings : LISTINGS, activeCategory);
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
      handleSaveToggle(id);
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
        selectedDate={selectedDate}
        guestCounts={guestCounts}
        isSearchOpen={isSearchOpen}
        isScrolled={isScrolled}
        onQueryChange={handleQueryChange}
        onCategoryChange={(id) => {
          setResultsSection(null);
          handleCategoryChange(id);
        }}
        onDateChange={handleDateChange}
        onGuestChange={handleGuestChange}
        onSearchOpen={setIsSearchOpen}
        onSearchReset={() => handleSearchReset({ keepSearchOpen: true })}
        onNearby={handleNearby}
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
            onHide={() => setIsMapVisible(false)}
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

function buildListingSections(listings: Listing[], activeCategory: string) {
  if (listings.length === 0) return [];

  const sectionListings = activeCategory === "loft" ? buildExperienceListings(listings) : listings;
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
