export type Category = {
  id: string;
  label: string;
};

export type Bounds = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type Listing = {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  summary: string;
  amenities: string[];
  maxGuests: number;
  allowsPets: boolean;
  availableDateKeys: string[];
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  images: string[];
  lat: number;
  lng: number;
};

export type ViewMode = "split" | "list" | "map";

export type SortOption = "default" | "price_asc" | "price_desc" | "rating";

export type GuestType = "adults" | "children" | "infants" | "pets";

export type GuestCounts = Record<GuestType, number>;

export type DateRange = {
  start: Date | null;
  end: Date | null;
};

export type SearchCriteria = {
  // Acceptable check-in dates — a single day, or a ± flexibility window.
  dateKeys: string[] | null;
  guests: GuestCounts;
};

// "Exact dates" plus the ± day offsets offered in the date picker.
export const DATE_FLEX_DAYS = [0, 1, 2, 3, 7, 14] as const;

export type Filters = {
  priceMin: number;
  priceMax: number;
  minRating: number;
  amenities: string[];
};

export const DEFAULT_FILTERS: Filters = {
  priceMin: 0,
  priceMax: 10_000,
  minRating: 0,
  amenities: [],
};

export const AMENITY_OPTIONS = [
  "4K monitor",
  "Ergonomic chair",
  "Coffee access",
  "Quiet room",
  "Standing desk",
  "Fiber internet",
];

export const CATEGORIES: Category[] = [
  { id: "all", label: "All spaces" },
  { id: "ergonomic", label: "Ergonomic Setup" },
  { id: "monitors", label: "Dual Monitors" },
  { id: "loft", label: "Creative Lofts" },
  { id: "coffee", label: "24/7 Coffee" },
  { id: "quiet", label: "Deep Focus" },
  { id: "podcast", label: "Podcast Ready" },
  { id: "team", label: "Team Sprint" },
];

export const INITIAL_BOUNDS: Bounds = {
  north: 20.2,
  east: 105.8,
  south: 5.6,
  west: 97.2,
};
