@AGENTS.md

# The Nomad Space — Airbnb-style Workspace Discovery Clone

แอปค้นหาพื้นที่ทำงาน (co-working / work-from-home loft) ในกรุงเทพฯ สไตล์ Airbnb สร้างด้วย Next.js 16, React 19, TypeScript และ Tailwind CSS v4

## Stack

| เทคโนโลยี | เวอร์ชัน | หมายเหตุ |
|---|---|---|
| Next.js | 16.2.7 | App Router, Turbopack enabled |
| React | 19.2.4 | ใช้ `"use client"` ทั้งหน้า |
| TypeScript | ^5 | strict mode |
| Tailwind CSS | ^4 | ใช้ `@import "tailwindcss"` แบบใหม่ (ไม่มี config file) |

## โครงสร้างไฟล์

```
app/
  layout.tsx      — Root layout: metadata, Geist font, html/body wrapper
  page.tsx        — หน้าหลักทั้งหมด (ดูรายละเอียดด้านล่าง)
  globals.css     — CSS ทั้งหมด: CSS custom properties, layout classes, animations
public/           — Static assets (SVG icons)
next.config.ts    — Next.js config (เปิด Turbopack)
```

## app/page.tsx — โครงสร้างภายใน

ไฟล์เดียวที่มี logic และ component ทั้งหมด

### Types
- `Category` — หมวดหมู่พื้นที่ (id, label, icon)
- `Bounds` — กรอบพิกัดแผนที่ (north/east/south/west)
- `Listing` — ข้อมูลพื้นที่ทำงาน (ราคา, ที่อยู่, รูป, lat/lng ฯลฯ)

### ข้อมูล Static
- `CATEGORIES` — 8 หมวด เช่น Ergonomic, Dual Monitors, Quiet, Podcast
- `LISTINGS` — 8 รายการพื้นที่ใน Bangkok (Ari, Chatuchak, Saphan Khwai ฯลฯ)
- `INITIAL_BOUNDS` — พิกัดเริ่มต้นของแผนที่ครอบคลุมพื้นที่ Ari–Chatuchak

### Component หลัก: `Home`
State ที่จัดการ:
- `query` / `debouncedQuery` — ค้นหา (debounce 180ms)
- `activeCategory` — filter หมวดหมู่
- `bounds` — viewport ของแผนที่
- `hoveredId` / `selectedId` — card ที่ hover/เลือก (ซิงค์กับ map marker)
- `isSearchOpen` / `isFilterOpen` — สถานะ popup
- `isLoading` — แสดง skeleton ระหว่างเปลี่ยน filter
- `viewMode` — split / list / map

### Helper Functions
| ฟังก์ชัน | ทำอะไร |
|---|---|
| `searchListings` | filter listings ตาม query, category, bounds |
| `isListingInsideBounds` | เช็คว่า listing อยู่ใน map viewport |
| `moveBounds` | เลื่อนแผนที่ขึ้น/ลง/ซ้าย/ขวา |
| `centerBoundsOnListing` | center แผนที่ไปที่ listing ที่เลือก |
| `getMarkerPosition` | คำนวณ % position ของ marker บนแผนที่ CSS |
| `_geoBoundingBox` | สร้าง string query สำหรับ Algolia geo search |

### Sub-components
| Component | ทำอะไร |
|---|---|
| `ListingCard` | การ์ดแสดงพื้นที่ มี image carousel (prev/next), save button, amenity chips |
| `MapMarker` | ปุ่มราคาบนแผนที่ CSS, highlight เมื่อ hover/select |
| `SkeletonGrid` | placeholder animation ขณะโหลด (6 card) |
| `EmptyState` | แสดงเมื่อไม่พบผลลัพธ์ + ปุ่ม clear |
| `FilterModal` | modal กรอง budget, rating, amenity chips |

## app/globals.css

CSS ทั้งหมดเขียนด้วย plain CSS ใช้ Tailwind เฉพาะ utility บน `html`/`body` ใน layout
ตัวแปรสี/spacing อยู่ใน `:root` เช่น `--brand`, `--muted`, `--shadow-floating`
มี responsive breakpoints ที่ 980px และ 620px
มี `@keyframes` สำหรับ fade-in, rise-in, modal-in, skeleton shimmer

## วิธีรัน

```bash
npm run dev    # dev server (Turbopack)
npm run build  # production build
npm run lint   # ESLint
```
