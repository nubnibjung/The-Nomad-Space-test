"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { signIn, useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { LISTINGS } from "@/lib/data";
import { getReviewsForListing } from "@/lib/reviews";
import { useLanguage } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import type { GuestCounts, Listing } from "@/lib/types";
import "./detail.css";

const EMPTY_GUESTS: GuestCounts = { adults: 1, children: 0, infants: 0, pets: 0 };
type AuthMode = "login" | "register";
const DetailLocationMap = dynamic(() => import("@/components/DetailLocationMap"), {
  ssr: false,
  loading: () => <div className="detail-map-loading" />,
});

const REVIEW_METRICS = [
  { label: "คะแนนโดยรวม", value: "5.0", icon: "bars" },
  { label: "ความสะอาด", value: "5.0", icon: "spray" },
  { label: "ความถูกต้อง", value: "5.0", icon: "check" },
  { label: "การเช็คอิน", value: "5.0", icon: "key" },
  { label: "การสื่อสาร", value: "5.0", icon: "message" },
  { label: "ทำเล", value: "4.9", icon: "map" },
  { label: "ความคุ้มค่า", value: "4.7", icon: "tag" },
] as const;

const REVIEW_TAGS = [
  { icon: "beach", label: "ชายหาด" },
  { icon: "deck", label: "พื้นที่ในร่ม" },
  { icon: "pin", label: "สถานที่" },
  { icon: "bath", label: "ห้องน้ำ" },
  { icon: "gift", label: "บริการต้อนรับ" },
  { icon: "clean", label: "ความสะอาด" },
  { icon: "family", label: "ครอบครัว" },
] as const;

const CALENDAR_MONTHS = [
  { label: "มิถุนายน 2026", year: 2026, monthIndex: 5, startOffset: 1, days: 30 },
  { label: "กรกฎาคม 2026", year: 2026, monthIndex: 6, startOffset: 3, days: 31 },
];

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const { locale, t } = useLanguage();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [anchorVisible, setAnchorVisible] = useState(false);
  const [anchorPriceVisible, setAnchorPriceVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const listing = LISTINGS.find((item) => item.id === id);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsSaved(false);
      return;
    }
    let active = true;
    fetch("/api/wishlist")
      .then((response) => (response.ok ? response.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => {
        if (active) setIsSaved((data.ids ?? []).includes(id));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status, id]);

  useEffect(() => {
    const hero = document.getElementById("photos");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAnchorVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mainGrid = document.getElementById("main-grid");
    if (!mainGrid) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAnchorPriceVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(mainGrid);
    return () => observer.disconnect();
  }, []);

  function requireMember() {
    if (status === "authenticated") return true;
    setAuthModalOpen(true);
    return false;
  }

  function handleSave() {
    if (!requireMember()) return;
    const next = !isSaved;
    setIsSaved(next);
    fetch("/api/wishlist", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    }).catch(() => setIsSaved(!next));
  }

  function handleReserve() {
    if (!requireMember()) return;
    setBookingModalOpen(true);
  }

  function handleChangeDates() {
    document.querySelector(".detail-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!listing) {
    return (
      <main className="listing-detail-page">
        <section className="listing-detail-empty">
          <h1>{t.detail.notFound}</h1>
          <Link href="/">The Nomad Space</Link>
        </section>
      </main>
    );
  }

  const galleryImages = buildGalleryImages(listing);
  const oldPrice = Math.round(listing.pricePerNight * 1.2);
  const rooms = getRoomStats(listing);
  const guestCount = Math.max(1, Math.min(2, listing.maxGuests));
  const stayDates = getStayDates(listing);
  const isBookingAvailable = stayDates.dateKeys.length > 0;
  const nightCount = Math.max(1, stayDates.dateKeys.length);

  return (
    <main className="listing-detail-page">
      <DetailHeader isHidden={anchorVisible} />
      <article className="listing-detail-shell">
        <section className="listing-detail-hero" id="photos">
          <div className="listing-detail-title-row">
            <h1>{getDetailTitle(listing)}</h1>
            <div className="listing-detail-actions">
              <button type="button" onClick={requireMember}>
                <Icon name="share" />
                {t.detail.share}
              </button>
              <button type="button" className={isSaved ? "is-saved" : ""} onClick={handleSave}>
                <Icon name="heart" />
                {isSaved ? t.listing.unsave : t.listing.save}
              </button>
            </div>
          </div>

          <div className="detail-gallery">
            {galleryImages.map((src, index) => (
              <span
                className={index === 0 ? "is-large" : ""}
                key={`${src}-${index}`}
                style={{ backgroundImage: `url("${src}")` }}
              />
            ))}
            <button className="detail-gallery-button" type="button">
              <Icon name="grid" />
              {t.detail.showAllPhotos}
            </button>
          </div>
        </section>

        <nav className={`detail-anchor-bar${anchorVisible ? " is-visible" : ""}`} aria-label="Listing sections">
          <div className="detail-anchor-links">
            <a href="#photos">รูป</a>
            <a href="#amenities">สิ่งอำนวยความสะดวก</a>
            <a href="#reviews">รีวิว</a>
            <a href="#location">ที่ตั้ง</a>
          </div>
          {anchorPriceVisible && (
            <div className="detail-sticky-reserve">
              <div className="detail-sticky-price">
                <p>
                  <del>{formatPrice(oldPrice, locale)}</del>
                  <strong>{formatPrice(listing.pricePerNight, locale)}</strong>
                  <span>{t.listing.priceForTwoNights}</span>
                </p>
                <small>★ {listing.rating.toFixed(1)} · {listing.reviewCount} {t.detail.reviews}</small>
              </div>
              <button type="button" onClick={handleReserve}>{t.detail.reserve}</button>
            </div>
          )}
        </nav>

        <div className="detail-main-grid" id="main-grid">
          <div className="detail-main">
            <section className="detail-summary">
              <h2>{t.detail.entirePlace} ใน {listing.neighborhood}</h2>
              <p>
                {listing.maxGuests} {t.detail.guests} · {rooms.bedrooms} {t.detail.bedrooms} · {rooms.beds} {t.detail.beds} · {rooms.baths} {t.detail.baths}
              </p>
            </section>

            <section className="detail-favorite-card">
              <strong>{t.listing.guestFavorite}</strong>
              <span>{t.detail.guestFavoriteLong}</span>
              <b>{listing.rating.toFixed(1)}</b>
              <em>{listing.reviewCount} {t.detail.reviews}</em>
            </section>

            <section className="detail-host-row">
              <span className="detail-host-avatar">T</span>
              <div>
                <strong>{t.detail.hostedBy} Tina</strong>
                <p>{t.detail.hostTime}</p>
              </div>
            </section>

            <section className="detail-highlights">
              {t.detail.highlights.map(([title, copy], index) => (
                <div className="detail-highlight" key={title}>
                  <Icon name={index === 0 ? "flame" : index === 1 ? "spark" : "key"} />
                  <div>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="detail-description">
              <div className="detail-translation-note">{t.detail.translationNote}</div>
              <h2>{t.detail.descriptionTitle}</h2>
              <p>{t.detail.description}</p>
            </section>

            <section className="detail-amenities" id="amenities">
              <h2>{t.detail.amenitiesTitle}</h2>
              <div className="detail-amenity-grid">
                {buildAmenities(listing).map((amenity) => (
                  <span key={amenity.label}>
                    <Icon name={amenity.icon} />
                    {amenity.label}
                  </span>
                ))}
              </div>
              <button type="button">{t.detail.showAmenities}</button>
            </section>

            <section className="detail-calendar">
              <h2>{t.detail.stayTitle} {listing.neighborhood.split(",")[0]}</h2>
              <p>{stayDates.checkIn} - {stayDates.checkOut}</p>
              <div className="detail-calendar-grid">
                {CALENDAR_MONTHS.map((month) => (
                  <CalendarMonth key={month.label} month={month} highlightKeys={stayDates.highlightKeys} />
                ))}
              </div>
            </section>
          </div>

          <aside className="detail-booking-column">
            <div className="detail-price-tip">
              <Icon name="tag" />
              {t.detail.priceLower}
            </div>
            <div className={`detail-booking-card${isBookingAvailable ? "" : " is-unavailable"}`} id="booking-card">
              {isBookingAvailable && (
                <p>
                  <del>{formatPrice(oldPrice, locale)}</del>
                  <strong>{formatPrice(listing.pricePerNight, locale)}</strong>
                  <span>{t.listing.priceForTwoNights}</span>
                </p>
              )}
              <div className={`detail-booking-fields${isBookingAvailable ? "" : " is-invalid"}`}>
                <label>
                  {t.detail.checkIn}
                  <strong>{stayDates.checkIn}</strong>
                </label>
                <label>
                  {t.detail.checkOut}
                  <strong>{stayDates.checkOut}</strong>
                </label>
                <label className="is-wide">
                  {t.search.guests}
                  <strong>
                    {guestCount} {t.search.guests}
                    <i className="bi bi-chevron-down" aria-hidden="true" />
                  </strong>
                </label>
              </div>
              {!isBookingAvailable && (
                <strong className="detail-booking-error">
                  <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                  {t.detail.unavailableDates}
                </strong>
              )}
              <button type="button" onClick={isBookingAvailable ? handleReserve : handleChangeDates}>
                {isBookingAvailable ? t.detail.reserve : t.detail.changeDates}
              </button>
              {isBookingAvailable && <small>{t.detail.noCharge}</small>}
            </div>
            <button className="detail-report-link" type="button">
              <Icon name="flag" />
              {t.detail.report}
            </button>
          </aside>
        </div>

        <section className="detail-reviews" id="reviews">
          <div className="detail-rating-hero">
            <Icon name="star" />
            <strong>{listing.rating.toFixed(1)}</strong>
            <Icon name="star" />
          </div>
          <h2>{t.detail.ratingTitle}</h2>
          <p>{t.detail.ratingCopy}</p>
          <div className="detail-review-cards">
            {getReviewsForListing(listing.id).map((review) => (
              <div className="detail-review-card" key={review.id}>
                <div className="detail-review-author">
                  <span className="detail-review-avatar">{review.authorInitial}</span>
                  <div>
                    <strong>{review.authorName}</strong>
                    <p>{review.memberSince}</p>
                  </div>
                </div>
                <div className="detail-review-stars" aria-label={`${review.rating} ดาว`}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  <span>{review.date}</span>
                </div>
                <p className="detail-review-text">{review.text}</p>
              </div>
            ))}
          </div>
          <button className="detail-show-reviews-btn" type="button">
            แสดงทั้ง {listing.reviewCount} รีวิว
          </button>
        </section>

        <section className="detail-location" id="location">
          <h2>{t.detail.locationTitle}</h2>
          <p>{listing.neighborhood}</p>
          <div className="detail-map-card">
            <DetailLocationMap listing={listing} />
          </div>
          <p>{t.detail.exactLocation}</p>
        </section>

        <section className="detail-host" id="host">
          <h2>{t.detail.meetHost}</h2>
          <div className="detail-host-grid">
            <div className="detail-host-card">
              <span className="detail-host-photo">T</span>
              <strong>Tina</strong>
              <small>{t.detail.hostedBy}</small>
              <ul>
                <li><b>29</b> {t.detail.reviews}</li>
                <li><b>4.97</b> คะแนน</li>
                <li><b>5</b> เดือนที่เป็นโฮสต์</li>
              </ul>
            </div>
            <div className="detail-host-copy">
              <h3>{t.detail.hostDetails}</h3>
              <p>อัตราการตอบกลับ: 100%<br />ตอบกลับภายใน 1 ชั่วโมง</p>
              <button type="button" onClick={requireMember}>{t.detail.messageHost}</button>
            </div>
          </div>
        </section>

        <section className="detail-know">
          <h2>{t.detail.thingsToKnow}</h2>
          <div>
            <article>
              <Icon name="calendar" />
              <strong>{t.detail.cancellation}</strong>
              <p>ยกเลิกฟรีภายใน 24 ชั่วโมง หลังจากนั้นขอเงินคืนบางส่วนตามนโยบายของโฮสต์</p>
            </article>
            <article>
              <Icon name="key" />
              <strong>{t.detail.houseRules}</strong>
              <p>เช็คอิน: 15:00 - 22:00<br />เช็คเอาท์ก่อน 12:00<br />เกสต์สูงสุด {listing.maxGuests} คน</p>
            </article>
            <article>
              <Icon name="shield" />
              <strong>{t.detail.safety}</strong>
              <p>ไม่มีเครื่องตรวจจับก๊าซคาร์บอนมอนอกไซด์<br />ที่พักมีกล้องวงจรปิดภายนอก</p>
            </article>
          </div>
        </section>
      </article>

      <footer className="detail-footer">
        <div>
          <strong>{t.detail.footerSupport}</strong>
          <span>{t.nav.helpCenter}</span>
          <span>AirCover</span>
          <span>{t.detail.report}</span>
        </div>
        <div>
          <strong>{t.detail.footerHosting}</strong>
          <span>{t.nav.hostStart}</span>
          <span>{t.nav.findCoHost}</span>
          <span>{t.nav.referHost}</span>
        </div>
        <div>
          <strong>{t.detail.footerAirbnb}</strong>
          <span>Release: พฤษภาคม 2026</span>
          <span>ห้องข่าว</span>
          <span>อาชีพ</span>
        </div>
      </footer>
      {authModalOpen && <DetailAuthModal onClose={() => setAuthModalOpen(false)} />}
      {bookingModalOpen && (
        <BookingConfirmModal
          listing={listing}
          stayDates={stayDates}
          guestCount={guestCount}
          nightCount={nightCount}
          totalPrice={listing.pricePerNight * nightCount}
          onClose={() => setBookingModalOpen(false)}
        />
      )}
    </main>
  );
}

function DetailHeader({ isHidden }: { isHidden: boolean }) {
  return (
    <header className={`detail-top-header${isHidden ? " is-hidden" : ""}`}>
      <Link className="detail-top-brand" href="/">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 25.5V11.2L16 4l11 7.2v14.3h-5.8V14.7L16 11.3l-5.2 3.4v10.8H5Z" />
          <path d="M13.1 25.5V17h5.8v8.5h-5.8Z" />
        </svg>
        <span>The Nomad Space</span>
      </Link>

      <Link className="detail-top-pill" href="/">
        <span className="detail-top-field">
          <strong>ที่ไหนก็ได้</strong>
        </span>
        <span className="detail-top-divider" />
        <span className="detail-top-field">
          <strong>เมื่อไรก็ได้</strong>
        </span>
        <span className="detail-top-divider" />
        <span className="detail-top-field">
          <strong>เพิ่มเกสต์</strong>
        </span>
        <span className="detail-top-search">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="white" strokeWidth="3">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
        </span>
      </Link>

      <div className="detail-top-actions">
        <Link href="/auth" className="detail-top-host">มาเป็นโฮสต์กัน</Link>
        <button className="detail-top-icon" type="button" aria-label="เมนู">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

function DetailAuthModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        if (!email.includes("@")) {
          setMessage(t.auth.invalidEmail);
          return;
        }

        if (password.length < 6) {
          setMessage(t.auth.shortPassword);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          setMessage(getRegisterErrorMessage(response.status, t.auth));
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage(t.auth.invalidCredentials);
        return;
      }

      const welcomeName = mode === "register" ? name.trim() : email.split("@")[0];
      window.sessionStorage.setItem("nomad-welcome-name", welcomeName || email);
      onClose();
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <div className="detail-auth-backdrop" role="presentation">
      <section className="detail-auth-modal" role="dialog" aria-modal="true" aria-labelledby="detail-auth-title">
        <button className="detail-auth-close" type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <span className="detail-auth-brand" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path d="M16 4c3.4 5 6.4 10 8.8 15 1.6 3.2-.8 6.5-4.3 6.5-2 0-3.5-1.1-4.5-2.8-1 1.7-2.5 2.8-4.5 2.8-3.5 0-5.9-3.3-4.3-6.5C9.6 14 12.6 9 16 4Z" />
            <path d="M12.2 20.2c0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8" />
          </svg>
        </span>
        <h2 id="detail-auth-title">{t.auth.title}</h2>

        <div className="detail-auth-tabs" role="tablist" aria-label={t.auth.modeLabel}>
          <button
            className={mode === "login" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
          >
            {t.auth.login}
          </button>
          <button
            className={mode === "register" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => switchMode("register")}
          >
            {t.auth.register}
          </button>
        </div>

        <form className="detail-auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              {t.auth.name}
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.auth.namePlaceholder}
              />
            </label>
          )}

          <label>
            {t.auth.email}
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            {t.auth.password}
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              required
            />
          </label>

          {message && <p className="detail-auth-message">{message}</p>}

          <button className="detail-auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.auth.submitting : mode === "register" ? t.auth.register : t.auth.login}
          </button>
        </form>
      </section>
    </div>
  );
}

function getRegisterErrorMessage(
  status: number,
  authText: {
    emailExists: string;
    invalidEmail: string;
    shortPassword: string;
    registerFailed: string;
  },
) {
  if (status === 409) return authText.emailExists;
  if (status === 400) return authText.shortPassword || authText.invalidEmail;
  return authText.registerFailed;
}

function BookingConfirmModal({
  listing,
  stayDates,
  guestCount,
  nightCount,
  totalPrice,
  onClose,
}: {
  listing: Listing;
  stayDates: { checkIn: string; checkOut: string };
  guestCount: number;
  nightCount: number;
  totalPrice: number;
  onClose: () => void;
}) {
  const { locale } = useLanguage();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="booking-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="booking-modal-close" type="button" aria-label="ปิด" onClick={onClose}>
          ×
        </button>

        {confirmed ? (
          <div className="booking-modal-success">
            <span className="booking-modal-check" aria-hidden="true">
              <i className="bi bi-check-lg" />
            </span>
            <h2 id="booking-modal-title">จองสำเร็จ!</h2>
            <p>ยืนยันการจอง “{listing.title}” เรียบร้อยแล้ว</p>
            <button type="button" className="booking-modal-confirm" onClick={onClose}>
              เสร็จสิ้น
            </button>
          </div>
        ) : (
          <>
            <h2 id="booking-modal-title">ยืนยันการจอง</h2>
            <div className="booking-modal-listing">
              <span
                className="booking-modal-thumb"
                style={{ backgroundImage: `url("${listing.images[0]}")` }}
                aria-hidden="true"
              />
              <div>
                <strong>{listing.title}</strong>
                <small>{listing.neighborhood}</small>
                <small>★ {listing.rating.toFixed(1)} · {listing.reviewCount} รีวิว</small>
              </div>
            </div>

            <dl className="booking-modal-summary">
              <div>
                <dt>เช็คอิน</dt>
                <dd>{stayDates.checkIn}</dd>
              </div>
              <div>
                <dt>เช็คเอาท์</dt>
                <dd>{stayDates.checkOut}</dd>
              </div>
              <div>
                <dt>เกสต์</dt>
                <dd>{guestCount} คน</dd>
              </div>
              <div>
                <dt>ระยะเวลา</dt>
                <dd>{nightCount} คืน</dd>
              </div>
            </dl>

            <div className="booking-modal-total">
              <span>ยอดรวม</span>
              <strong>{formatPrice(totalPrice, locale)}</strong>
            </div>

            <button type="button" className="booking-modal-confirm" onClick={() => setConfirmed(true)}>
              ยืนยันการจอง
            </button>
            <p className="booking-modal-note">ยังไม่มีการเรียกเก็บเงินจากคุณ</p>
          </>
        )}
      </section>
    </div>
  );
}

function CalendarMonth({
  month,
  highlightKeys,
}: {
  month: { label: string; year: number; monthIndex: number; startOffset: number; days: number };
  highlightKeys: Set<string>;
}) {
  return (
    <div className="detail-month">
      <strong>{month.label}</strong>
      <div>
        {Array.from({ length: 35 }, (_, index) => {
          const day = index - month.startOffset + 1;
          const isVisible = day > 0 && day <= month.days;
          const dateKey = `${month.year}-${String(month.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const active = isVisible && highlightKeys.has(dateKey);

          return (
            <span className={active ? "is-active" : ""} key={index}>
              {isVisible ? day : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getStayDates(listing: Listing) {
  const keys = [...listing.availableDateKeys].sort();
  if (keys.length === 0) {
    return { checkIn: "", checkOut: "", dateKeys: [] as string[], highlightKeys: new Set<string>() };
  }

  // หา 2 คืนติดกันคู่แรก ถ้าไม่มีก็ใช้คืนแรกคืนเดียว
  let startIndex = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    if (dayDiff(keys[i], keys[i + 1]) === 1) {
      startIndex = i;
      break;
    }
  }

  const firstNight = keys[startIndex];
  const hasSecondNight = keys[startIndex + 1] && dayDiff(firstNight, keys[startIndex + 1]) === 1;
  const lastNight = hasSecondNight ? keys[startIndex + 1] : firstNight;
  const dateKeys = hasSecondNight ? [firstNight, lastNight] : [firstNight];

  const checkInDate = parseDateKey(firstNight);
  const checkOutDate = parseDateKey(lastNight);
  checkOutDate.setDate(checkOutDate.getDate() + 1);

  return {
    checkIn: formatDateKey(checkInDate),
    checkOut: formatDateKey(checkOutDate),
    dateKeys,
    highlightKeys: new Set<string>([...dateKeys, toDateKey(checkOutDate)]),
  };
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateKey(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function dayDiff(a: string, b: string) {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86400000);
}

function ScoreBars() {
  return (
    <div className="detail-score-bars" aria-hidden="true">
      {[5, 4, 3, 2, 1].map((score) => (
        <span className="detail-score-row" key={score}>
          {score}
          <i />
        </span>
      ))}
    </div>
  );
}

function buildGalleryImages(listing: Listing) {
  return Array.from({ length: 5 }, (_, index) => listing.images[index % listing.images.length]);
}

function getRoomStats(listing: Listing) {
  return {
    bedrooms: Math.max(1, Math.ceil(listing.maxGuests / 2)),
    beds: Math.max(1, listing.maxGuests - 1),
    baths: Math.max(1, Math.ceil(listing.maxGuests / 3)),
  };
}

function getDetailTitle(listing: Listing) {
  return `${listing.title} · ${listing.neighborhood}`;
}

function buildAmenities(listing: Listing) {
  const core: { icon: IconName; label: string }[] = [
    { icon: "waves", label: "ใกล้ชายหาด" },
    { icon: "wifi", label: "Wi-Fi" },
    { icon: "car", label: "มีที่จอดรถฟรีบริเวณที่พัก" },
    { icon: "paw", label: listing.allowsPets ? "นำสัตว์เลี้ยงเข้ามาได้" : "ไม่อนุญาตสัตว์เลี้ยง" },
    { icon: "utensils", label: "ครัว" },
    { icon: "briefcase", label: "พื้นที่ทำงาน" },
    { icon: "pool", label: "สระ" },
    { icon: "camera", label: "ที่พักมีกล้องวงจรปิดภายนอก" },
  ];

  return [...core, ...listing.amenities.slice(0, 2).map((label) => ({ icon: "check" as const, label }))];
}

type IconName =
  | "bars"
  | "bath"
  | "beach"
  | "briefcase"
  | "calendar"
  | "camera"
  | "car"
  | "check"
  | "clean"
  | "deck"
  | "family"
  | "flag"
  | "flame"
  | "gift"
  | "grid"
  | "heart"
  | "home"
  | "key"
  | "laurel"
  | "map"
  | "message"
  | "paw"
  | "pin"
  | "pool"
  | "share"
  | "shield"
  | "spark"
  | "spray"
  | "star"
  | "tag"
  | "utensils"
  | "waves"
  | "wifi";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    bars: <><path d="M4 7h16M4 12h12M4 17h8" /></>,
    bath: <><path d="M5 12h14v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-3Z" /><path d="M7 12V7a3 3 0 0 1 6 0v1" /></>,
    beach: <><path d="M4 16c1.4 0 2-.7 3.4-.7s2 .7 3.4.7 2-.7 3.4-.7 2 .7 3.4.7 2-.7 3-.7" /><path d="M12 15V7M7 9c2.5-3 7.5-3 10 0H7Z" /></>,
    briefcase: <><path d="M8 8V6h8v2" /><rect x="4" y="8" width="16" height="11" rx="2" /></>,
    calendar: <><rect x="5" y="6" width="14" height="13" rx="2" /><path d="M8 4v4M16 4v4M5 10h14" /></>,
    camera: <><path d="M5 8h4l1.5-2h3L15 8h4v10H5V8Z" /><circle cx="12" cy="13" r="3" /></>,
    car: <><path d="M6 15h12l-1.5-5h-9L6 15Z" /><path d="M7 15v3M17 15v3M6 18h12" /></>,
    check: <><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.4 2.4 4.8-5" /></>,
    clean: <><path d="M9 13 6 20M15 13l3 7M8 13h8l-1-7H9l-1 7Z" /><path d="M10 6h4M12 2v4" /></>,
    deck: <><path d="M5 16h14M7 13h10M9 10h6M6 19h12" /><path d="M8 16v3M16 16v3" /></>,
    family: <><circle cx="9" cy="8" r="2.2" /><circle cx="16" cy="9" r="1.8" /><path d="M4.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0" /></>,
    flag: <><path d="M6 20V5h9l1 3h4v8h-9l-1-3H6" /></>,
    flame: <><path d="M12 21c3.5-1.4 5-3.7 5-6.2 0-2.8-1.8-4.3-3.5-6.1-.9 2-2.3 3-4.2 4.3C7.9 14 7 15.2 7 16.9 7 19 8.8 20.5 12 21Z" /></>,
    gift: <><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 13h16M12 9v11M8.5 9C7 8.2 6.4 7.1 7 6.1c.8-1.3 3.2.1 5 2.9 1.8-2.8 4.2-4.2 5-2.9.6 1-.1 2.1-1.5 2.9" /></>,
    grid: <><path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" /></>,
    heart: <><path d="M12 20.5c-4.2-2.9-8-6-8-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8 2.3c0 4.2-3.8 7.3-8 10.2Z" /></>,
    home: <><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" /></>,
    key: <><circle cx="8" cy="12" r="3" /><path d="M11 12h9M17 12v3M14 12v2" /></>,
    laurel: <><path d="M11 4C7 6 5 9.5 5 14.5c0 2.7 1 4.8 3 6" /><path d="M9 7c-2.5.2-4 .9-5 2M8 11c-2.5.4-4 1.3-5 2.8M8 15c-2 .8-3.2 1.9-3.8 3.4" /></>,
    map: <><path d="M5 6.5 10 4l5 2.5 4-1.5v12.5L14 20l-5-2.5-4 1.5V6.5Z" /><path d="M10 4v13.5M15 6.5V20" /></>,
    message: <><path d="M5 6.5h14v9H9l-4 3v-12Z" /></>,
    paw: <><circle cx="8" cy="8" r="1.5" /><circle cx="12" cy="6.5" r="1.5" /><circle cx="16" cy="8" r="1.5" /><path d="M7.5 16c.7-3 2.2-4.5 4.5-4.5s3.8 1.5 4.5 4.5c.3 1.5-.7 2.5-2 2.5h-5c-1.3 0-2.3-1-2-2.5Z" /></>,
    pin: <><path d="M12 21s6-4.3 6-10a6 6 0 1 0-12 0c0 5.7 6 10 6 10Z" /><circle cx="12" cy="11" r="2" /></>,
    pool: <><path d="M5 12c1.2 0 1.8.8 3 .8s1.8-.8 3-.8 1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8M5 17c1.2 0 1.8.8 3 .8s1.8-.8 3-.8 1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8" /></>,
    share: <><path d="M12 4v11" /><path d="m8 8 4-4 4 4" /><path d="M5 13v6h14v-6" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.4 7.5-7 10-4.6-2.5-7-5.5-7-10V6l7-3Z" /></>,
    spark: <><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" /></>,
    spray: <><path d="M10 4h5v4h-5zM12.5 8v3M9 11h7v9H9zM16 5h3" /></>,
    star: <><path fill="currentColor" stroke="none" d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z" /></>,
    tag: <><path d="M4 11V5h6l9 9-6 6-9-9Z" /><circle cx="8" cy="8" r="1" /></>,
    utensils: <><path d="M7 4v8M5 4v8M9 4v8M5 12h4v8M16 4v16M14 4c0 4 4 4 4 8" /></>,
    waves: <><path d="M4 13c1.5 0 2-.8 3.5-.8S9.5 13 11 13s2-.8 3.5-.8S16.5 13 18 13s2-.8 3-.8M4 17c1.5 0 2-.8 3.5-.8S9.5 17 11 17s2-.8 3.5-.8S16.5 17 18 17s2-.8 3-.8" /></>,
    wifi: <><path d="M5 10c4.7-4 9.3-4 14 0M8 13c2.7-2.2 5.3-2.2 8 0M11 16c.7-.5 1.3-.5 2 0" /><circle cx="12" cy="19" r="1" /></>,
  };

  return (
    <svg className="detail-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
