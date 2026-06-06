export type Review = {
  id: string;
  authorName: string;
  authorInitial: string;
  memberSince: string;
  rating: number;
  date: string;
  text: string;
};

const POOL: Review[] = [
  { id: "r01", authorName: "Su", authorInitial: "S", memberSince: "เข้าร่วมมาแล้ว 7 เดือน", rating: 5, date: "เมษายน 2026", text: "เจ้าของที่พักใจดีมาก เนื่องจากไม่มีคนเข้าพักก่อนหน้า ครอบครัวสามารถเช็คอินก่อนเวลาได้ ที่พักใหม่มาก เฟอร์นิเจอร์แข็งแรงและมีคุณภาพ โซฟาก็ดีและใช้งานได้ ชอบมาก จะกลับมาอีกแน่นอน" },
  { id: "r02", authorName: "Meow", authorInitial: "M", memberSince: "เข้าร่วมมาแล้ว 13 ปี", rating: 5, date: "2 สัปดาห์ที่แล้ว", text: "วิลล่าที่น่าเหมาะสุด ๆ รู้สึกเหมือนอยู่บ้านเลยหลังจากเช็คอิน หวังว่าเราจะพักได้นานกว่า 2 คืน ทุกอย่างดีมาก สระว่ายน้ำมีขนาดใหญ่กว่าที่คิด ห้องน้ำสะอาดและทันสมัย" },
  { id: "r03", authorName: "Santisuk", authorInitial: "S", memberSince: "เข้าร่วมมาแล้ว 2 ปี", rating: 4, date: "3 สัปดาห์ที่แล้ว", text: "เพิ่มจุดทิ้งขยะ และ พื้นที่นอกกลิ่นไปหน่อย โดยรวมดีมากครับ ทำเลดี เดินทางสะดวก เจ้าของตอบสนองรวดเร็ว" },
  { id: "r04", authorName: "小嘉", authorInitial: "小", memberSince: "เข้าร่วมมาแล้ว 4 ปี", rating: 5, date: "พฤษภาคม 2026", text: "เจ้าของที่พักเป็นมิตรมาก และปัญหาใด ๆ ก็ได้รับการแก้ไขอย่างรวดเร็ว บ้านมีขนาดใหญ่และกว้างขวางมาก เหมาะสำหรับกลุ่มเพื่อนที่จะมาเที่ยวด้วยกัน" },
  { id: "r05", authorName: "Krit", authorInitial: "K", memberSince: "เข้าร่วมมาแล้ว 9 ปี", rating: 5, date: "4 วันที่แล้ว", text: "บ้านหลังนี้สวยงามและกว้างขวาง นอกจากนี้ทำเลยังดีมาก ใกล้ห้าง ร้านอาหาร และสถานที่ท่องเที่ยว" },
  { id: "r06", authorName: "Sheena Kim", authorInitial: "S", memberSince: "เข้าร่วมมาแล้ว 1 เดือน", rating: 5, date: "4 สัปดาห์ที่แล้ว", text: "ให้ความรู้สึกเหมือนอยู่บ้านตัวเอง ที่พักดีมากและสะอาดมาก เจ้าของที่พักดีมาก 🥰😍 จะกลับมาอีกครั้งอย่างแน่นอน ❤️" },
  { id: "r07", authorName: "Nong", authorInitial: "N", memberSince: "เข้าร่วมมาแล้ว 6 เดือน", rating: 5, date: "1 เดือนที่แล้ว", text: "ที่พักสวยมาก สะอาด ครบเครื่อง วิวสวย เจ้าของน่ารักและช่วยเหลือดี จะแนะนำเพื่อน ๆ มาพักที่นี่แน่นอน" },
  { id: "r08", authorName: "James", authorInitial: "J", memberSince: "เข้าร่วมมาแล้ว 3 ปี", rating: 4, date: "2 เดือนที่แล้ว", text: "Great place, very clean and spacious. The location is convenient. Host was responsive and helpful. Will definitely come back." },
  { id: "r09", authorName: "พิม", authorInitial: "พ", memberSince: "เข้าร่วมมาแล้ว 1 ปี", rating: 5, date: "3 เดือนที่แล้ว", text: "พักที่นี่แล้วประทับใจมาก สถานที่สวยงาม สะอาด เจ้าของใจดี มีสิ่งอำนวยความสะดวกครบ แนะนำมากเลยค่ะ" },
  { id: "r10", authorName: "Tom", authorInitial: "T", memberSince: "เข้าร่วมมาแล้ว 5 ปี", rating: 5, date: "มีนาคม 2026", text: "Amazing stay! The workspace was exactly what I needed. Fast internet, comfortable chair, and a great view. Highly recommend for remote workers." },
];

export function getReviewsForListing(listingId: string, count = 6): Review[] {
  const seed = listingId.replace(/\D/g, "").slice(-2);
  const offset = parseInt(seed, 10) % POOL.length;
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    reviews.push(POOL[(offset + i) % POOL.length]);
  }
  return reviews;
}
