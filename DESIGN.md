# The Nomad Space — DESIGN.md

## 1. ภาพรวมของโปรเจกต์

โปรเจกต์ **The Nomad Space** เป็นเว็บสำหรับค้นหาที่พัก ลอฟต์ และบริการที่เหมาะกับ developer, digital nomad หรือคนที่ต้องการพื้นที่ทำงาน/พักผ่อนในกรุงเทพฯ

แนวคิดหลักของงานนี้คือการทำหน้า discovery ให้ใช้งานง่าย ดูทันสมัย และให้ประสบการณ์ใกล้เคียงกับแพลตฟอร์มอย่าง Airbnb โดยเน้นส่วนสำคัญ เช่น navbar, search bar, listing card, wishlist, map view, filter และ animation ต่าง ๆ

ในเวอร์ชันนี้ ระบบหลักที่ทำเสร็จแล้วคือ flow สำหรับค้นหา เลือกหมวดหมู่ ดูรายการที่พักหรือบริการ กดบันทึก wishlist และดูข้อมูลร่วมกับ map ได้

---

## 2. สิ่งที่พัฒนาแล้ว

ฟีเจอร์หลักที่ทำไว้ในโปรเจกต์นี้มีดังนี้

* Header แบบ fixed/sticky ที่เปลี่ยนขนาดเมื่อ scroll
* Search bar ที่เปลี่ยนสถานะได้ระหว่างแบบ compact และ expanded
* Search bar มี field สำหรับสถานที่ วันที่ และจำนวนแขก
* Category tab สำหรับแยกประเภท เช่น ที่พัก เอ็กซ์พีเรียนซ์ และบริการ
* Listing card พร้อมรูปภาพ ราคา rating และปุ่ม wishlist
* Image carousel ภายใน card
* ปุ่มหัวใจสำหรับบันทึกรายการ
* หน้า Wishlist สำหรับแสดงรายการที่ผู้ใช้บันทึกไว้
* Map view สำหรับแสดงตำแหน่งของ listing
* การ sync ระหว่าง card กับ marker บน map เมื่อ hover หรือเลือก item
* Filter modal
* Skeleton loading เพื่อลด layout shift
* Empty state เมื่อไม่พบข้อมูล
* รองรับ reduced motion สำหรับผู้ใช้ที่ไม่ต้องการ animation เยอะ

---

## 3. แนวคิดด้าน UI Design

UI ของโปรเจกต์นี้เน้นความเรียบง่าย ใช้พื้นที่ว่างเยอะ และให้ผู้ใช้เข้าใจได้ทันทีว่าต้องค้นหาอะไรจากตรงไหน

Header ถูกออกแบบให้ใหญ่ตอนอยู่บนสุด เพื่อให้ search bar เด่นและใช้งานง่าย แต่เมื่อผู้ใช้ scroll ลงมา header จะหุบลงให้เล็กลง เพื่อคืนพื้นที่ให้กับเนื้อหาหลัก

Search bar เป็นส่วนที่สำคัญที่สุดของหน้า จึงมีการออกแบบให้มีหลายสถานะ เช่น

* ตอนปกติเป็น pill ขนาดใหญ่
* ตอนกดใช้งานจะขยายและแสดง field แบบชัดเจน
* ตอน scroll ลงมาจะกลายเป็น compact search bar
* มี hover state เพื่อให้ผู้ใช้รู้ว่ากำลังเลือก field ไหนอยู่

Listing card ใช้รูปภาพเป็นจุดเด่น มีมุมโค้ง ขนาดใกล้เคียง reference และมีข้อมูลเท่าที่จำเป็น เช่น ชื่อที่พัก ราคา จำนวนคน และ rating

---

## 4. Design Tokens

ค่าหลักของ design system ที่ใช้ในโปรเจกต์นี้มีดังนี้

| ส่วน                 | ค่าโดยประมาณ                               |
| -------------------- | ------------------------------------------ |
| Header ตอนปกติ       | 196px                                      |
| Header ตอน scroll    | 80px - 96px                                |
| Search pill compact  | 48px                                       |
| Search pill expanded | 66px - 78px                                |
| Border radius หลัก   | 999px สำหรับ pill, 12px - 20px สำหรับ card |
| Border color         | `#dddddd`                                  |
| Muted text           | `#717171`                                  |
| Text หลัก            | `#222222`                                  |
| Background หลัก      | `#ffffff`                                  |
| Search hover         | `#dddddd`                                  |
| Search rest          | `#ebebeb`                                  |
| Search active        | `#ffffff`                                  |
| Primary button       | `#111111`                                  |

โดยรวมแล้วสีที่ใช้จะคุมให้อยู่ในโทนขาว เทา ดำ เพื่อให้ดู clean และคล้าย modern travel platform

---

## 5. โครงสร้าง State

แนวคิดหลักคือให้หน้า discovery เป็นตัวกลางในการควบคุม state สำคัญทั้งหมด เช่น

* คำค้นหา
* หมวดหมู่ที่เลือก
* วันที่
* จำนวนแขก
* รายการที่ hover
* รายการที่เลือก
* รายการ wishlist
* สถานะ loading
* bounds ของ map

การเก็บ state ไว้ในหน้าเดียวช่วยให้ list และ map ใช้ข้อมูลชุดเดียวกันได้ง่าย เช่น เมื่อ hover card ก็ทำให้ marker บน map active ด้วย หรือเมื่อ hover marker ก็ทำให้ card ที่ตรงกัน active เช่นกัน

แนวทางนี้ทำให้ไม่จำเป็นต้องใช้ global store ในช่วง prototype และยังทำให้ debug ง่ายขึ้น

---

## 6. Search และ Filtering

ระบบค้นหาตอนนี้ยังเป็น local search แต่โครงสร้างถูกออกแบบไว้ให้สามารถเปลี่ยนไปใช้ Meilisearch ได้ในอนาคต

หลักการทำงานคือ

1. ผู้ใช้พิมพ์ keyword หรือเลือก filter
2. ระบบ debounce ค่าค้นหาเล็กน้อยเพื่อไม่ให้ค้นหาถี่เกินไป
3. นำ query, category และ bounds ของ map ไป filter ข้อมูล
4. แสดงผลลัพธ์เป็น listing card และ marker บน map

มีการใช้แนวคิด request guard เพื่อป้องกันปัญหา response เก่ากลับมาทับ response ใหม่ ซึ่งจะสำคัญมากถ้าในอนาคตเปลี่ยนจาก local search เป็น API จริง

---

## 7. Map Strategy

ในเวอร์ชันนี้ map ยังไม่ได้ใช้ MapLibre หรือ Mapbox จริง แต่ใช้การจำลองตำแหน่งบนแผนที่ด้วย CSS และข้อมูล latitude/longitude

ตำแหน่งของ marker คำนวณจาก bounds ของ map แล้วแปลงเป็น percentage เพื่อวาง marker บนพื้นที่แผนที่

ถึงจะยังไม่ใช่แผนที่จริง แต่ logic หลักที่สำคัญถูกเตรียมไว้แล้ว เช่น

* วาง marker ตามตำแหน่ง
* hover card แล้ว marker active
* hover marker แล้ว card active
* เลือก card แล้ว map recenter
* ขยับ map แล้ว filter ใหม่ตาม bounds

ถ้าจะนำไป production จริง ควรเปลี่ยนเป็น MapLibre GL JS เพื่อให้มี tile map, zoom, clustering และการ flyTo ที่ smooth กว่า

---

## 8. Animation

Animation ในโปรเจกต์นี้ใช้ CSS เป็นหลัก ไม่ได้ใช้ library เพิ่ม เช่น Framer Motion

เหตุผลคือ animation ที่ใช้ส่วนใหญ่เป็น transition พื้นฐาน เช่น

* search bar morph
* header shrink
* scrim fade
* modal slide
* card carousel
* marker hover
* skeleton loading
* category underline

การใช้ CSS ทำให้ bundle เบากว่า และยังควบคุม timing ได้ง่าย

ค่า easing หลักที่ใช้คือแนว soft deceleration เพื่อให้ movement ดูนุ่ม ไม่กระตุก และใกล้กับ feel ของ Airbnb

---

## 9. Loading และ Empty State

โปรเจกต์นี้มี skeleton loading เพื่อให้ตอนโหลดข้อมูล หน้าไม่กระโดดหรือ layout shift

Skeleton ถูกออกแบบให้มี aspect ratio ใกล้กับ card จริง เมื่อโหลดเสร็จแล้วจึงแทนที่ด้วยข้อมูลจริงได้ทันทีโดยไม่ทำให้หน้าเว็บขยับเยอะ

กรณีที่ไม่พบข้อมูล จะมี empty state พร้อมข้อความอธิบายและปุ่มให้ผู้ใช้กลับไปเริ่มค้นหาใหม่

---

## 10. Wishlist

Wishlist ใช้สำหรับให้ผู้ใช้บันทึกรายการที่สนใจ โดยกดปุ่มหัวใจบน card

ข้อมูล wishlist ถูกแสดงในหน้า Wishlist และสามารถจัดกลุ่มตามชื่อ wishlist ได้

ในเชิง production ควรให้ wishlist เก็บใน backend หรือ database จริง เพื่อให้ข้อมูลยังอยู่หลัง refresh และสามารถ sync กับ account ของผู้ใช้ได้

---

## 11. Accessibility

โปรเจกต์นี้คำนึงถึง accessibility พื้นฐาน เช่น

* ปุ่ม icon มี `aria-label`
* modal มี role และ aria ที่เหมาะสม
* grid ผลลัพธ์มี `aria-live`
* loading state มี `aria-busy`
* ปุ่มและ input มี focus visible
* รองรับ `prefers-reduced-motion`

สิ่งเหล่านี้ช่วยให้ผู้ใช้ที่ใช้ keyboard หรือ assistive technology สามารถใช้งานได้ดีขึ้น

---

## 12. Tradeoffs

| สิ่งที่เลือกทำ         | เหตุผล                             | ข้อแลกเปลี่ยน                       |
| ---------------------- | ---------------------------------- | ----------------------------------- |
| ใช้ CSS animation      | เบาและควบคุมง่าย                   | ยังไม่มี spring physics             |
| ใช้ CSS map            | ไม่ต้องใช้ token หรือ external map | ยังไม่ใช่แผนที่จริง                 |
| ใช้ local search       | ทำ prototype ได้เร็ว               | ยังไม่ใช่ search engine จริง        |
| เก็บ state ในหน้าเดียว | sync list/map ง่าย                 | ถ้าโปรเจกต์ใหญ่ขึ้นอาจต้องแยก store |
| ใช้ font open-source   | ใช้ได้จริง ไม่มี license issue     | metric ไม่เหมือน Airbnb 100%        |

---

## 13. ข้อจำกัดปัจจุบัน

สิ่งที่ยังไม่สมบูรณ์หรือควรปรับต่อ ได้แก่

* ยังไม่ได้ใช้ Meilisearch จริง
* Map ยังเป็น CSS map ไม่ใช่ tile map จริง
* ยังไม่มี marker clustering
* Search bar บาง animation ยังไม่เหมือน reference 100%
* Wishlist บางส่วนยังต้องพึ่ง backend ให้เสถียรกว่านี้
* ยังไม่มี URL state sync สำหรับ query/filter/map
* ยังต้อง polish responsive layout เพิ่มในบางจุด

---

## 14. สิ่งที่ควรทำต่อ

ถ้ามีเวลาพัฒนาต่อ สิ่งที่ควรทำเป็นลำดับถัดไปคือ

1. เชื่อม MapLibre GL JS เพื่อใช้แผนที่จริง
2. เชื่อม Meilisearch สำหรับ search/filter จริง
3. ทำ URL state sync เพื่อให้แชร์ลิงก์ผลการค้นหาได้
4. ทำ wishlist persistence ให้สมบูรณ์
5. เพิ่ม marker clustering
6. ปรับ search bar animation ให้ใกล้ reference มากขึ้น
7. เพิ่ม keyboard navigation ใน listing grid
8. แยก component และ logic ให้เป็นระบบมากขึ้น

---

## 15. สรุป

The Nomad Space เป็นโปรเจกต์ discovery platform ที่เน้นประสบการณ์การค้นหาที่พักและบริการแบบ modern travel website

จุดเด่นของงานนี้คือการออกแบบ UI ให้ใกล้ reference, การทำ search bar และ navbar ที่มีหลาย state, การ sync ระหว่าง list กับ map, การมี skeleton loading และการเตรียม architecture ให้ต่อยอดกับ backend หรือ search engine จริงได้

โดยรวมแล้วโปรเจกต์นี้ยังเป็น prototype แต่มีโครงสร้างและ UX หลักที่พร้อมต่อยอดไปเป็นระบบจริงได้
