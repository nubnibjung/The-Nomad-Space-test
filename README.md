# The Nomad Space

Creative work-from-home loft discovery for developers, designers, and digital nomads around Saphan Khwai, Ari, and Chatuchak.

The product concept keeps the Airbnb-style discovery challenge, but makes the inventory more intentional: ergonomic chairs, 4K monitor setups, quiet coding rooms, cafe-connected spaces, podcast-ready studios, and team sprint lofts.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run build
```

## What is included

- Expanding/collapsing header search bar with scrim.
- Sticky horizontal category bar for work-specific categories.
- Listing grid with image carousel, dots, hover, focus, loading, and empty states.
- Split/list/map view toggle.
- Map/list hover synchronization.
- Bounds-driven search-as-you-move behavior.
- Listing selection that recenters the map bounds around the selected point.
- Filter modal with workspace-specific filters.
- `prefers-reduced-motion` support.

## Notes for reviewers

`DESIGN.md` is the main artifact. It explains the measured design tokens, product positioning, state model, animation choices, map/search tradeoffs, and known gaps.

The app uses local typed sample data because no Meilisearch Cloud host/key or map provider token was provided. The search path is structured so the local `searchListings()` function can be replaced by a Meilisearch call using the same `query`, `category`, and `bounds` state.
