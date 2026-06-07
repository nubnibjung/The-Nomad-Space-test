# The Nomad Space

แอปค้นหาที่พัก ลอฟต์ เอ็กซ์พีเรียนซ์ และบริการ สไตล์ Airbnb สำหรับ developer, designer และ digital nomad ในประเทศไทย
_An Airbnb-style discovery app for finding work-from-home lofts, experiences, and services for developers, designers, and digital nomads across Thailand._

สร้างด้วย Next.js 16, React 19, TypeScript และ Tailwind CSS v4 ใช้ Meilisearch สำหรับค้นหา, แผนที่จริงด้วย MapLibre, ล็อกอินด้วย NextAuth และเก็บ wishlist ลง Postgres โดยทุกส่วนมี fallback ในเครื่อง จึงรันได้แม้ไม่ได้เปิด service เหล่านี้
_Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It uses Meilisearch for search, a real MapLibre map, NextAuth for login, and Postgres for wishlists — with graceful local fallbacks so it still runs without any of those services._

---

## 🧱 Tech stack

| ส่วน / Part | เทคโนโลยี / Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| ค้นหา / Search | Meilisearch (+ local fallback) |
| แผนที่ / Map | MapLibre GL ผ่าน react-map-gl + tiles จาก OpenFreeMap |
| ล็อกอิน / Auth | NextAuth (Credentials, JWT session) |
| ฐานข้อมูล / Database | Postgres (`pg`) สำหรับ wishlist + ไฟล์ JSON สำหรับ user |

---

## 🚀 เริ่มแบบเร็ว / Quick start (ไม่ต้องใช้ Docker / no Docker)

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`
_Open `http://localhost:3000`._

ถ้าไม่ได้เปิด Meilisearch/Postgres แอปจะ fallback ไปใช้ข้อมูลตัวอย่างในเครื่องสำหรับการค้นหา และเก็บ wishlist เป็นไฟล์ JSON ให้อัตโนมัติ — เล่นดูได้ครบทุกหน้า
_Without Meilisearch/Postgres running, the app automatically falls back to local sample data for search and a JSON file for the wishlist, so you can browse everything._

---

## 🐳 ติดตั้งแบบเต็ม / Full setup (Meilisearch + Postgres)

ต้องเปิด **Docker Desktop** ก่อน
_Requires **Docker Desktop** to be running._

**1. สร้างไฟล์ `.env.local` / Create `.env.local`:**

```bash
NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_KEY=masterKey
NEXT_PUBLIC_MEILISEARCH_INDEX=listings
DATABASE_URL=postgres://nomad:nomad@localhost:5432/nomad_space
AUTH_SECRET=any-long-random-string
```

**2. เปิด service + seed ข้อมูลค้นหา / Start services + seed search data:**

```bash
npm run setup
```

คำสั่งนี้จะ `docker compose up -d` (เปิด Postgres + Meilisearch) แล้ว seed listing เข้า Meilisearch
_This runs `docker compose up -d` (Postgres + Meilisearch) and then seeds listings into Meilisearch._

**3. รันแอป / Run the app:**

```bash
npm run dev
```

หรือรัน database + แอปพร้อมกันในเทอร์มินัลเดียว
_Or run the database and the app together in one terminal:_

```bash
npm run dev:full
```

---

## 🛠️ Scripts ที่ใช้บ่อย / Common scripts

| Command | คำอธิบาย / Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | รัน production build / serve the build |
| `npm run lint` | ตรวจโค้ดด้วย ESLint / lint the code |
| `npm run setup` | เปิด Docker + seed Meilisearch / start Docker + seed |
| `npm run db:up` / `npm run db:down` | เปิด/ปิด Postgres + Meilisearch / start/stop services |
| `npm run db:seed` | seed listing เข้า Meilisearch / seed listings into Meilisearch |

---

## 📁 โครงสร้างโปรเจกต์ / Project structure

```
app/                หน้าและ API (App Router) / pages & API routes
  page.tsx          หน้า discovery หลัก / main discovery page
  listings/[id]/    หน้ารายละเอียดที่พัก / listing detail page
  profile, wishlist, auth, ...   หน้าอื่น ๆ / other pages
  api/              auth, profile, wishlist endpoints
components/         UI components (Header, ListingCard, MapPanel, RealMap, ...)
hooks/              useDiscovery (state รวม), useTheme
lib/                logic & data
  search.ts         Meilisearch + local fallback
  data.ts           ข้อมูล listing + localSearch
  db.ts             Postgres pool
  userStore.ts      เก็บ user เป็นไฟล์ JSON
  wishlistRepository.ts   wishlist (Postgres + JSON fallback)
  i18n.tsx          ระบบสองภาษา ไทย/อังกฤษ
scripts/seed-meilisearch.ts   สคริปต์ seed
docker-compose.yml  Postgres + Meilisearch
```

---

## ✨ ฟีเจอร์ / Features

- **Search bar** ที่ขยาย/หุบได้ มี field สถานที่ วันที่ และจำนวนแขก
  _Expanding/collapsing search bar with location, date, and guest fields._
- **Category tabs** แยกเป็น ที่พัก / เอ็กซ์พีเรียนซ์ / บริการ แต่ละแท็บมีเนื้อหาของตัวเอง
  _Stays / experiences / services tabs, each with its own content._
- **Listing card** มี image carousel, rating และปุ่มหัวใจบันทึก wishlist
  _Listing cards with image carousel, rating, and a wishlist (heart) button._
- **แผนที่จริง MapLibre** แสดง marker ราคา, sync hover/select กับการ์ด และ search-as-you-move ตาม bounds
  _Real MapLibre map with price markers, hover/select sync, and search-as-you-move._
- **ค้นหาด้วย Meilisearch** รองรับ geo bounding box, filter หมวด/ราคา/คะแนน และ sort (มี local fallback)
  _Meilisearch search with geo bounding box, category/price/rating filters, and sorting._
- **ล็อกอิน/สมัครสมาชิก + หน้าโปรไฟล์** (แก้ชื่อ + รูป) และสลับภาษาไทย/อังกฤษได้
  _Login/register, profile editing (name + avatar), and Thai/English toggle._
- **Wishlist ผูกกับบัญชี** เก็บใน Postgres (มี fallback เป็นไฟล์ JSON)
  _Per-account wishlist stored in Postgres (with JSON-file fallback)._
- **ปฏิทิน** จองได้ตั้งแต่วันนี้เป็นต้นไปเท่านั้น และแท็บ experience มี quick picker (วันนี้/พรุ่งนี้/สุดสัปดาห์หน้า)
  _Date picker allows today onwards only; experiences have a quick "today / tomorrow / next weekend" picker._
- **อื่น ๆ:** filter modal, skeleton loading, empty state และรองรับ `prefers-reduced-motion`
  _Plus: filter modal, skeleton loading, empty state, and `prefers-reduced-motion` support._

---

## 🔁 การ fallback / How fallbacks work

แอปออกแบบให้รันได้แม้ไม่มี backend:
_The app is designed to run even without a backend:_

- **ค้นหา / Search** — ถ้าต่อ Meilisearch ไม่ได้ หรือไม่ได้ตั้ง host จะใช้ `localSearch` กรองจากข้อมูลในเครื่องแทน
  _If Meilisearch isn't reachable or configured, it uses `localSearch` over in-memory data._
- **Wishlist** — ถ้าต่อ Postgres ไม่ได้ จะเก็บลงไฟล์ `data/wishlists.json` ชั่วคราว ไม่ทำให้ปุ่มหัวใจพัง
  _If Postgres isn't reachable, it saves to `data/wishlists.json` so the heart button never breaks._

---

## 📝 หมายเหตุ / Notes

`DESIGN.md` คือเอกสารออกแบบหลัก อธิบายแนวคิด UI, design tokens, โครงสร้าง state, กลยุทธ์ search/map, accessibility, tradeoffs และสิ่งที่ควรทำต่อ
_`DESIGN.md` is the main design write-up — it covers the UI approach, design tokens, state model, search/map strategy, accessibility, tradeoffs, and next steps._
