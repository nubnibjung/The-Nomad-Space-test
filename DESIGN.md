# The Nomad Space — DESIGN.md

## 1. ภาพรวมของโปรเจกต์

The Nomad Space เป็นเว็บค้นหาที่พัก ลอฟต์ เอ็กซ์พีเรียนซ์ และบริการต่าง ๆ สำหรับ developer, digital nomad และคนที่มองหาพื้นที่ทำงาน/พักผ่อนในไทย โดยตั้งใจให้หน้า discovery ใช้งานง่ายและให้ฟีลใกล้เคียงกับ Airbnb

เป้าหมายของงานคือทำ flow การค้นหาให้ครบและลื่น ตั้งแต่ navbar, search bar, การเลือกหมวดหมู่, listing card, wishlist, แผนที่, ตัวกรอง ไปจนถึง animation ต่าง ๆ ให้ออกมาดูเรียบและทันสมัย

เวอร์ชันนี้ไม่ได้หยุดแค่ prototype หน้าเดียว แต่ต่อ backend จริงเข้ามาด้วย คือมีระบบค้นหาด้วย Meilisearch, แผนที่จริงด้วย MapLibre, ระบบล็อกอินด้วย NextAuth และ wishlist ที่เก็บลง Postgres

## 2. Stack ที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| ค้นหา | Meilisearch (มี local fallback) |
| แผนที่ | MapLibre GL ผ่าน react-map-gl + tile จาก OpenFreeMap |
| ล็อกอิน | NextAuth (Credentials, session แบบ JWT) |
| ฐานข้อมูล | Postgres (`pg`) สำหรับ wishlist + ไฟล์ JSON สำหรับ user |
| ไอคอน | Bootstrap Icons |

Meilisearch กับ Postgres รันผ่าน Docker (`docker compose up`) แล้ว seed ข้อมูล listing เข้า Meilisearch ด้วย `npm run db:seed`

## 3. สิ่งที่พัฒนาแล้ว

- Header แบบ sticky ที่หุบเล็กลงเมื่อ scroll
- Search bar ที่เปลี่ยนสถานะระหว่าง compact / expanded และมี field สถานที่ วันที่ จำนวนแขก
- Category tab แยกเป็น ที่พัก / เอ็กซ์พีเรียนซ์ / บริการ
- Listing card พร้อม image carousel, ราคา, rating และปุ่มหัวใจ
- หน้า Wishlist ที่ดึงรายการที่บันทึกไว้จากฐานข้อมูลจริง (ต้องล็อกอินก่อน)
- แผนที่จริงด้วย MapLibre แสดง marker ราคาของแต่ละ listing
- การ sync ระหว่าง card กับ marker บนแผนที่ตอน hover หรือเลือก
- ระบบล็อกอิน/สมัครสมาชิก และหน้าโปรไฟล์ (แก้ชื่อ + รูปโปรไฟล์)
- รองรับสองภาษา ไทย/อังกฤษ
- Filter modal, skeleton loading, empty state
- ปฏิทินที่จองได้ตั้งแต่วันนี้เป็นต้นไป (เลือกวันย้อนหลังไม่ได้)
- รองรับ `prefers-reduced-motion`

## 4. แนวคิดด้าน UI

UI เน้นเรียบ ใช้พื้นที่ว่างเยอะ และคุมโทนสีให้อยู่ในกลุ่มขาว–เทา–ดำ เพื่อให้ดูเป็น modern travel platform และให้ผู้ใช้โฟกัสที่รูปและข้อมูลของแต่ละที่พัก

Header ออกแบบให้ใหญ่ตอนอยู่บนสุดเพื่อให้ search bar เด่น แล้วหุบลงตอน scroll เพื่อคืนพื้นที่ให้เนื้อหา ส่วน search bar เป็นพระเอกของหน้า เลยทำหลายสถานะ ทั้งตอนปกติ (pill ใหญ่), ตอนกดใช้งาน (ขยายและโชว์ field ชัด), ตอน scroll (กลายเป็น compact) และมี hover state บอกว่ากำลังเลือก field ไหน

Listing card ใช้รูปเป็นจุดเด่น มุมโค้ง ขนาดใกล้ reference และโชว์เฉพาะข้อมูลที่จำเป็น เช่น ชื่อ ราคา และ rating

## 5. Design Tokens

| ส่วน | ค่าโดยประมาณ |
|---|---|
| Header ตอนปกติ | ~196px (พื้นที่รวม search) |
| Header ตอน scroll | ~74–82px |
| Search pill compact | 48px |
| Search pill expanded | 66px |
| Border radius | 999px สำหรับ pill, ~12px สำหรับ card |
| Border | `#dddddd` |
| Text หลัก | `#222222` |
| Muted text | `#717171` |
| Background | `#ffffff` |
| ปุ่มหลัก | `#111111` |

ค่าสีและ spacing เก็บเป็น CSS custom properties ใน `:root` ของ `globals.css` และ CSS ส่วนใหญ่เขียนเป็น plain CSS

## 6. โครงสร้าง State

state สำคัญเกือบทั้งหมดของหน้า discovery รวมอยู่ใน hook เดียวคือ `useDiscovery` เช่น คำค้นหา, หมวดหมู่, วันที่, จำนวนแขก, ตัวกรอง, bounds ของแผนที่, รายการที่ hover/เลือก และสถานะ loading

การรวม state ไว้ที่เดียวทำให้ list กับ map ใช้ข้อมูลชุดเดียวกัน เลย sync กันง่าย เช่น hover card แล้ว marker active หรือ hover marker แล้ว card active โดยยังไม่ต้องใช้ global store และ debug ง่ายกว่า ส่วน wishlist ที่ผูกกับ account จะดึงผ่าน API หลังล็อกอิน ไม่ปนกับ state ฝั่ง UI

## 7. Search และ Filtering

ระบบค้นหาใช้ Meilisearch เป็นหลัก โดย `lib/search.ts` จะส่ง query พร้อม filter ของหมวดหมู่ ช่วงราคา rating และกรอบพื้นที่ของแผนที่ (`_geoBoundingBox`) ไปที่ Meilisearch รวมถึงรองรับการ sort ตามราคา/คะแนน

หลักการทำงานคือ
1. ผู้ใช้พิมพ์ keyword หรือปรับ filter
2. ระบบ debounce ค่าเล็กน้อยกันค้นหาถี่เกินไป
3. ส่ง query + category + bounds + filter ไป Meilisearch
4. แสดงผลเป็น listing card และ marker บนแผนที่

มี request guard (นับ request id) กันไม่ให้ response เก่ากลับมาทับ response ใหม่ ซึ่งสำคัญเพราะตอนนี้เป็น async call จริง และถ้าเชื่อม Meilisearch ไม่ได้ (ไม่ได้ตั้ง host หรือ timeout) ระบบจะ fallback ไปใช้ `localSearch` ที่กรองจากข้อมูลในเครื่องแทน เพื่อให้หน้ายังใช้งานได้ นอกจากนี้ยังรองรับการค้นหาภาษาไทยด้วยการ map ชื่อย่านอังกฤษ–ไทยเข้าไปใน searchable text

## 8. Map Strategy

แผนที่ในเวอร์ชันนี้เป็น MapLibre GL จริง (ผ่าน `react-map-gl/maplibre`) ใช้ tile ฟรีจาก OpenFreeMap และโหลดแบบ dynamic (`ssr: false`) เพื่อไม่ให้ตัวแผนที่ไปถ่วงตอน render ฝั่ง server

สิ่งที่ทำบนแผนที่
- วาง marker ราคาตามพิกัด lat/lng ของแต่ละ listing
- hover card แล้ว marker active และในทางกลับกัน
- เลือก card แล้วแผนที่เลื่อนไปหา
- ขยับ/zoom แผนที่แล้ว search ใหม่ตาม bounds
- มี NavigationControl และโหมด dark (กลับสีด้วย CSS)

หน้า detail ของแต่ละที่พักก็มีแผนที่แสดงตำแหน่งแยกอีกตัว (`DetailLocationMap`)

## 9. Animation

Animation ใช้ CSS เป็นหลัก ไม่ได้เพิ่ม library อย่าง Framer Motion เพราะส่วนใหญ่เป็น transition พื้นฐาน เช่น search bar morph, header shrink, scrim fade, modal slide, card carousel, marker hover, skeleton และ category underline

ข้อดีคือ bundle เบากว่าและคุม timing ได้ง่าย ค่า easing หลักเป็นแนว soft deceleration เพื่อให้ขยับนุ่ม ๆ ใกล้ฟีลของ Airbnb

## 10. Loading และ Empty State

มี skeleton loading ระหว่างโหลดข้อมูล โดยทำ aspect ratio ให้ใกล้ card จริง เพื่อลด layout shift เวลาข้อมูลโผล่มา ถ้าค้นหาแล้วไม่เจออะไร จะมี empty state พร้อมข้อความอธิบายและปุ่มให้กลับไปเริ่มค้นหาใหม่

## 11. Wishlist และ Auth

ผู้ใช้สมัครสมาชิก/ล็อกอินด้วยอีเมล–รหัสผ่านผ่าน NextAuth (Credentials) รหัสผ่านถูก hash ด้วย scrypt และเก็บข้อมูล user เป็นไฟล์ JSON ส่วนรูปโปรไฟล์เสิร์ฟผ่าน API แยก

Wishlist ทำงานหลังล็อกอินเท่านั้น กดหัวใจที่ card แล้วระบบจะบันทึกลง Postgres (ตาราง `wishlists`) แล้วเอาไปแสดงในหน้า Wishlist ได้ ถ้าต่อ Postgres ไม่ได้ (เช่นยังไม่เปิด Docker) ระบบจะ fallback ไปเก็บเป็นไฟล์ JSON ชั่วคราว เพื่อไม่ให้ปุ่มหัวใจพังหรือขึ้น error

## 12. Accessibility

ดูแล accessibility พื้นฐานไว้ เช่น
- ปุ่มไอคอนมี `aria-label`
- modal มี `role` และ aria ที่เหมาะสม
- grid ผลลัพธ์มี `aria-live`, ตอนโหลดมี `aria-busy`
- ปุ่มและ input มี focus visible
- รองรับ `prefers-reduced-motion`

ช่วยให้คนที่ใช้ keyboard หรือ assistive technology ใช้งานได้ดีขึ้น

## 13. Tradeoffs

| สิ่งที่เลือกทำ | เหตุผล | ข้อแลกเปลี่ยน |
|---|---|---|
| Animation ด้วย CSS | เบาและคุมง่าย | ยังไม่มี spring physics |
| รวม state ใน `useDiscovery` | sync list/map ง่าย | ถ้าโปรเจกต์ใหญ่ขึ้นอาจต้องแยก store |
| user store เป็นไฟล์ JSON | ทำได้เร็ว ไม่ต้องตั้ง schema | ไม่เหมาะ production ควรย้ายเข้า DB |
| Meilisearch + local fallback | ใช้งานได้แม้ยังไม่เปิด service | ผล fallback ไม่ครบเท่า engine จริง |
| ใช้ font open-source | ไม่มีปัญหา license | metric ไม่เหมือน Airbnb 100% |

## 14. ข้อจำกัดปัจจุบัน

- ระบบ user/auth ยังเก็บเป็นไฟล์ JSON ควรย้ายเข้า Postgres ให้ครบ
- ยังไม่มี marker clustering บนแผนที่ตอน zoom out
- search bar บาง animation ยังไม่เป๊ะเท่า reference
- ยังไม่มี URL state sync สำหรับ query/filter/map (แชร์ลิงก์ผลค้นหายังไม่ได้)
- responsive บางจุดยังต้อง polish เพิ่ม

## 15. สิ่งที่ควรทำต่อ

1. ย้าย user/auth จากไฟล์ JSON เข้า Postgres ทั้งหมด
2. ทำ URL state sync เพื่อแชร์ลิงก์ผลการค้นหาได้
3. เพิ่ม marker clustering บนแผนที่
4. ปรับ animation ของ search bar ให้ใกล้ reference มากขึ้น
5. เพิ่ม keyboard navigation ใน listing grid
6. เขียน test ให้ flow หลัก ๆ

## 16. สรุป

The Nomad Space เป็น discovery platform ที่เน้นประสบการณ์ค้นหาที่พักและบริการแบบ modern travel website จุดเด่นคือ UI ที่ใกล้ reference, search bar และ navbar หลาย state, การ sync ระหว่าง list กับ map จริง, ระบบล็อกอินและ wishlist ที่ผูกกับ account รวมถึงการต่อ Meilisearch และ Postgres เข้ามาจริง

โดยรวมงานนี้พัฒนาเกินระดับ prototype ไปแล้ว มีทั้งฝั่ง UI และ backend ที่ทำงานได้จริง และวางโครงไว้ให้ต่อยอดเป็นระบบเต็มได้ไม่ยาก
