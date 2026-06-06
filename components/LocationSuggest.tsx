import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n";
import { thaiLocationKeywords } from "@/lib/data";

type Suggestion = {
  id: string;
  name: string;
  desc: string;
  icon: ReactNode;
};

type Props = {
  query: string;
  onSelect: (value: string) => void;
  onNearby: () => void;
  variant?: "default" | "experience";
};

export function LocationSuggest({ query, onSelect, onNearby, variant = "default" }: Props) {
  const { t } = useLanguage();
  const q = query.toLowerCase().trim();
  const isExperience = variant === "experience";
  const suggestions = isExperience ? buildExperienceSuggestions() : buildSuggestions(t.locations.suggestions);
  const filtered = q
    ? suggestions.filter(
        (suggestion) =>
          suggestion.id.includes(q) ||
          suggestion.name.toLowerCase().includes(q) ||
          suggestion.desc.toLowerCase().includes(q) ||
          thaiLocationKeywords(suggestion.name).includes(q),
      )
    : suggestions;

  if (filtered.length === 0) return null;

  if (isExperience) {
    const [nearbySuggestion, ...destinationSuggestions] = filtered;

    return (
      <div className="location-suggest is-experience" role="listbox" aria-label={t.locations.aria}>
        {nearbySuggestion && (
          <LocationSuggestButton
            suggestion={nearbySuggestion}
            onNearby={onNearby}
            onSelect={onSelect}
          />
        )}
        {destinationSuggestions.length > 0 && (
          <p className="location-suggest-heading">จุดหมายปลายทางแนะนำ</p>
        )}
        {destinationSuggestions.map((suggestion) => (
          <LocationSuggestButton
            key={suggestion.id}
            suggestion={suggestion}
            onNearby={onNearby}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="location-suggest" role="listbox" aria-label={t.locations.aria}>
      <p className="location-suggest-heading">
        {q ? t.locations.matching : t.locations.popular}
      </p>
      {filtered.map((suggestion) => (
        <LocationSuggestButton
          key={suggestion.id}
          suggestion={suggestion}
          onNearby={onNearby}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function LocationSuggestButton({
  suggestion,
  onNearby,
  onSelect,
}: {
  suggestion: Suggestion;
  onNearby: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      className="location-suggest-item"
      type="button"
      role="option"
      aria-selected="false"
      onClick={() => {
        if (suggestion.id === "nearby") {
          onNearby();
          return;
        }
        onSelect(suggestion.name);
      }}
    >
      <span className="location-suggest-icon">{suggestion.icon}</span>
      <span className="location-suggest-text">
        <strong>{suggestion.name}</strong>
        <span>{suggestion.desc}</span>
      </span>
    </button>
  );
}

function buildExperienceSuggestions(): Suggestion[] {
  return [
    {
      id: "nearby",
      name: "บริเวณใกล้เคียง",
      desc: "ค้นหาในบริเวณใกล้เคียง",
      icon: <NearbyIcon />,
    },
    {
      id: "tokyo",
      name: "โตเกียว, ญี่ปุ่น",
      desc: "เด่นเรื่องแลนด์มาร์คอย่าง ตึกคอนโดทาวเวอร์โตเกียว",
      icon: <NeighborhoodIcon color="#1f8f46" />,
    },
    {
      id: "osaka",
      name: "โอซากะ, ญี่ปุ่น",
      desc: "มีสีสันยามค่ำคืน",
      icon: <NeighborhoodIcon color="#ef8a3a" />,
    },
    {
      id: "chiang mai",
      name: "เชียงใหม่, ประเทศไทย",
      desc: "เหมาะกับสายธรรมชาติ",
      icon: <NeighborhoodIcon color="#b4574f" />,
    },
    {
      id: "sapporo",
      name: "ซัปโปโร, ญี่ปุ่น",
      desc: "เด่นเรื่องแลนด์มาร์คอย่าง หอนาฬิกาซัปโปโร",
      icon: <NeighborhoodIcon color="#9b5b54" />,
    },
    {
      id: "shinjuku",
      name: "ชินจูกุ, ญี่ปุ่น",
      desc: "เด่นเรื่องร้านอาหารรสเลิศ",
      icon: <NeighborhoodIcon color="#4c9f52" />,
    },
  ];
}

function buildSuggestions(items: readonly { id: string; name: string; desc: string }[]): Suggestion[] {
  return items.map((item) => ({
    ...item,
    icon: item.id === "nearby" ? <NearbyIcon /> : <NeighborhoodIcon color={getSuggestionColor(item.id)} />,
  }));
}

function NearbyIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 28s11-7.5 11-15a11 11 0 1 0-22 0c0 7.5 11 15 11 15z" />
      <circle cx="16" cy="13" r="3.5" fill="white" />
    </svg>
  );
}

function NeighborhoodIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="14" width="12" height="16" rx="2" fill={color} fillOpacity=".15" stroke={color} strokeWidth="2" />
      <rect x="18" y="8" width="12" height="22" rx="2" fill={color} fillOpacity=".15" stroke={color} strokeWidth="2" />
      <path d="M8 14V8l6-5 6 5v6" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function getSuggestionColor(id: string) {
  const colors: Record<string, string> = {
    ari: "#111111",
    chatuchak: "#333333",
    "saphan khwai": "#555555",
    phahonyothin: "#484848",
    pradiphat: "#767676",
    "kamphaeng phet": "#222222",
  };

  return colors[id] ?? "#111111";
}
