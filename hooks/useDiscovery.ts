"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchListings } from "@/lib/search";
import { LISTINGS, localSearch, normalizeSearchQuery } from "@/lib/data";
import { DEFAULT_FILTERS, INITIAL_BOUNDS } from "@/lib/types";
import type { Bounds, Filters, GuestCounts, GuestType, Listing, SearchCriteria, SortOption, ViewMode } from "@/lib/types";

type SearchResetOptions = {
  keepSearchOpen?: boolean;
};

const INITIAL_GUEST_COUNTS: GuestCounts = {
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
};
const MIN_GUEST_COUNTS: GuestCounts = {
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
};
const HEADER_TOP_Y = 0;
const HEADER_TOP_IDLE_MS = 140;
const SEARCH_QUERY_DEBOUNCE_MS = 80;

export function useDiscovery() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [bounds, setBounds] = useState<Bounds>(INITIAL_BOUNDS);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guestCounts, setGuestCounts] = useState<GuestCounts>(INITIAL_GUEST_COUNTS);
  const [autoSearch, setAutoSearch] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const requestIdRef = useRef(0);
  const topIdleTimerRef = useRef<number | null>(null);
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null;
  const searchCriteria = useMemo<SearchCriteria>(
    () => ({ dateKey: selectedDateKey, guests: guestCounts }),
    [guestCounts, selectedDateKey],
  );

  // Debounce query
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let active = true;

    fetch("/api/wishlist")
      .then((response) => (response.ok ? response.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => {
        if (active) setSavedIds(new Set(data.ids ?? []));
      })
      .catch(() => {
        if (active) setSavedIds(new Set());
      });

    return () => {
      active = false;
    };
  }, []);

  // Run search whenever any search input changes
  const runSearch = useCallback(
    async (q: string, cat: string, b: Bounds, f: Filters, s: SortOption, c: SearchCriteria) => {
      const id = ++requestIdRef.current;
      const localResults = searchLocalListingsInBounds(q, cat, b, f, s, c);

      setListings(localResults);
      setIsLoading(false);

      try {
        const results = await searchListingsInBounds(q, cat, b, f, s, c);
        if (requestIdRef.current === id) {
          setListings(results);
          setIsLoading(false);
        }
      } catch {
        if (requestIdRef.current === id) {
          setListings([]);
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      runSearch(debouncedQuery, activeCategory, bounds, filters, sortBy, searchCriteria);
    }, 0);
    return () => window.clearTimeout(id);
  }, [debouncedQuery, activeCategory, bounds, filters, sortBy, searchCriteria, runSearch]);

  // Keep the header and sticky sidebar in sync with the actual scroll position.
  useEffect(() => {
    const onScroll = () => {
      const shouldCollapse = window.scrollY > HEADER_TOP_Y;

      if (topIdleTimerRef.current !== null) {
        window.clearTimeout(topIdleTimerRef.current);
        topIdleTimerRef.current = null;
      }

      if (shouldCollapse) {
        setIsScrolled((isCollapsed) => (isCollapsed ? isCollapsed : true));
        setIsSearchOpen(false);
        return;
      }

      topIdleTimerRef.current = window.setTimeout(() => {
        setIsScrolled((isCollapsed) => (isCollapsed ? false : isCollapsed));
        topIdleTimerRef.current = null;
      }, HEADER_TOP_IDLE_MS);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (topIdleTimerRef.current !== null) {
        window.clearTimeout(topIdleTimerRef.current);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const selectedListing = listings.find((l) => l.id === selectedId) ?? null;

  // Compute active filter count
  const activeFilterCount = (
    (filters.priceMin > 0 ? 1 : 0) +
    (filters.priceMax < 10_000 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    filters.amenities.length
  );

  function handleNearby() {
    if (!navigator.geolocation) return;
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setUserLocation({ lat, lng });
        const span = 0.025; // ~2.5 km radius
        setBounds({ north: lat + span, south: lat - span, east: lng + span, west: lng - span });
        setNearbyLoading(false);
      },
      () => setNearbyLoading(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function handleQueryChange(value: string) { setQuery(value); }
  function handleCategoryChange(id: string) {
    if (id === activeCategory) return;

    setActiveCategory(id);
    setQuery("");
    setDebouncedQuery("");
    setBounds(INITIAL_BOUNDS);
    setFilters(DEFAULT_FILTERS);
    setSortBy("default");
    setSelectedDate(null);
    setGuestCounts(INITIAL_GUEST_COUNTS);
    setSelectedId(null);
    setAutoSearch(false);
    setIsSearchOpen(false);
    setIsFilterOpen(false);
    window.scrollTo({ top: 0 });
  }
  function handleDateChange(date: Date | null) { setSelectedDate(date); }
  function handleGuestChange(type: GuestType, delta: 1 | -1) {
    setGuestCounts((current) => ({
      ...current,
      [type]: Math.max(MIN_GUEST_COUNTS[type], current[type] + delta),
    }));
  }
  function handleSortChange(s: SortOption) { setSortBy(s); }
  function handleFiltersApply(f: Filters) { setFilters(f); setIsFilterOpen(false); }
  function handleSearchReset(options: SearchResetOptions = {}) {
    setQuery("");
    setDebouncedQuery("");
    setActiveCategory("all");
    setBounds(INITIAL_BOUNDS);
    setFilters(DEFAULT_FILTERS);
    setSortBy("default");
    setSelectedDate(null);
    setGuestCounts(INITIAL_GUEST_COUNTS);
    setSelectedId(null);
    setAutoSearch(false);
    setIsSearchOpen(Boolean(options.keepSearchOpen));
    setIsFilterOpen(false);
  }

  const handleBoundsChange = useCallback((newBounds: Bounds) => {
    setBounds(newBounds);
  }, []);

  function handleListingSelect(listing: Listing) {
    setSelectedId(listing.id);
  }

  function handleSaveToggle(id: string, name?: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      const isSaved = next.has(id);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      syncWishlistToggle(id, isSaved, name).catch(() => setSavedIds(prev));
      return next;
    });
  }

  return {
    query, handleQueryChange,
    activeCategory, handleCategoryChange,
    selectedDate, handleDateChange,
    guestCounts, handleGuestChange,
    bounds, handleBoundsChange,
    filters, handleFiltersApply, activeFilterCount,
    sortBy, handleSortChange,
    handleSearchReset,
    autoSearch, setAutoSearch,
    userLocation, nearbyLoading, handleNearby,
    listings, isLoading,
    hoveredId, setHoveredId,
    selectedId, selectedListing, handleListingSelect,
    viewMode, setViewMode,
    isSearchOpen, setIsSearchOpen,
    isFilterOpen, setIsFilterOpen,
    isScrolled,
    savedIds, handleSaveToggle,
  };
}

async function syncWishlistToggle(id: string, isSaved: boolean, name?: string) {
  const response = await fetch("/api/wishlist", {
    method: isSaved ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId: id, name }),
  });

  if (!response.ok) {
    throw new Error("Failed to sync wishlist");
  }
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function searchListingsInBounds(
  query: string,
  category: string,
  bounds: Bounds,
  filters: Filters,
  sortBy: SortOption,
  criteria: SearchCriteria,
) {
  const results = await searchListings(query, category, bounds, filters, sortBy, criteria);
  return sortByDistanceFromBoundsCenter(results, bounds);
}

function searchLocalListingsInBounds(
  query: string,
  category: string,
  bounds: Bounds,
  filters: Filters,
  sortBy: SortOption,
  criteria: SearchCriteria,
) {
  const results = localSearch(
    LISTINGS,
    normalizeSearchQuery(query),
    category,
    bounds,
    filters,
    sortBy,
    criteria,
  );

  return sortByDistanceFromBoundsCenter(results, bounds);
}

function sortByDistanceFromBoundsCenter(listings: Listing[], bounds: Bounds) {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  return [...listings].sort((first, second) => (
    getDistanceScore(first, centerLat, centerLng) - getDistanceScore(second, centerLat, centerLng)
  ));
}

function getDistanceScore(listing: Listing, lat: number, lng: number) {
  return (listing.lat - lat) ** 2 + (listing.lng - lng) ** 2;
}
