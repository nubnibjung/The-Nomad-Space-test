"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LanguageModal } from "./LanguageModal";
import { LocationSuggest } from "./LocationSuggest";
import { useLanguage } from "@/lib/i18n";
import type { GuestCounts, GuestType } from "@/lib/types";

type SearchStep = "where" | "when" | "who";
type DatePickerMode = "dates" | "flexible";

const CALENDAR_START_DATE = new Date(2026, 5, 1);
const MIN_SELECTABLE_DATE = new Date(2026, 5, 4);
type Props = {
  query: string;
  activeCategory: string;
  selectedDate: Date | null;
  guestCounts: GuestCounts;
  isSearchOpen: boolean;
  isScrolled: boolean;
  onQueryChange: (v: string) => void;
  onCategoryChange: (id: string) => void;
  onDateChange: (date: Date | null) => void;
  onGuestChange: (type: GuestType, delta: 1 | -1) => void;
  onSearchOpen: (open: boolean) => void;
  onSearchReset: () => void;
  onNearby: () => void;
  serviceType: string | null;
  onServiceChange: (key: string | null) => void;
};

export function Header({
  query, activeCategory, selectedDate, guestCounts, isSearchOpen, isScrolled,
  onQueryChange, onCategoryChange, onDateChange, onGuestChange, onSearchOpen, onSearchReset, onNearby,
  serviceType, onServiceChange,
}: Props) {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activeSearchStep, setActiveSearchStep] = useState<SearchStep>("where");
  const [datePickerMode, setDatePickerMode] = useState<DatePickerMode>("dates");
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [selectedDateFlexIndex, setSelectedDateFlexIndex] = useState(0);
  const [selectedStayLengthIndex, setSelectedStayLengthIndex] = useState(0);
  const [flexibleMonthOffset, setFlexibleMonthOffset] = useState(0);
  const [selectedFlexibleMonth, setSelectedFlexibleMonth] = useState(CALENDAR_START_DATE);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const authMenuRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number; bottom: number } | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(".nomad-tab.is-active");
    if (!activeBtn) return;
    setUnderlineStyle({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      bottom: container.offsetHeight - activeBtn.offsetTop - activeBtn.offsetHeight,
    });
  }, [activeCategory]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    let resizeObserver: ResizeObserver | null = null;

    function measureActiveField() {
      const activeFieldEl = pill?.querySelector<HTMLElement>(".search-field.is-active");
      setHighlightStyle(
        activeFieldEl ? { left: activeFieldEl.offsetLeft, width: activeFieldEl.offsetWidth } : null,
      );
    }

    measureActiveField();

    const fields = pill.querySelectorAll(".search-field");
    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        measureActiveField();
      });
      fields.forEach((field) => resizeObserver?.observe(field));
    }

    window.addEventListener("resize", measureActiveField);
    return () => {
      window.removeEventListener("resize", measureActiveField);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isSearchOpen, activeSearchStep, activeCategory, isScrolled]);

  const isExperienceSearch = activeCategory === "loft";
  const isServiceSearch = activeCategory === "coffee";

  const tabs = [
    { id: "all", label: t.nav.tabs.all, icon: "🏠" },
    { id: "loft", label: t.nav.tabs.loft, icon: "🎈", badge: t.nav.tabs.new },
    { id: "coffee", label: t.nav.tabs.coffee, icon: "🛎️", badge: t.nav.tabs.new },
  ];
  const userInitial = getUserInitial(session?.user?.name ?? session?.user?.email);
  const guestSearchCount = getGuestSearchCount(guestCounts);
  const hasCustomGuestCount = guestSearchCount > 0 || guestCounts.pets > 0;
  const guestSummary = hasCustomGuestCount ? `${guestSearchCount} ${t.search.guests}` : t.search.addGuests;
  const dateSummary = selectedDate ? formatSearchDate(selectedDate, t.datePicker.shortMonths) : t.search.addDates;
  const compactDateSummary = selectedDate ? formatSearchDate(selectedDate, t.datePicker.shortMonths) : t.search.anytime;
  const rightSearchLabel = isServiceSearch ? t.search.serviceType : t.search.who;
  const selectedServiceLabel = t.search.serviceOptions.find((option) => option.key === serviceType)?.label;
  const rightSearchSummary = isServiceSearch ? (selectedServiceLabel ?? t.search.addService) : guestSummary;
  const activeField = isSearchOpen ? activeSearchStep : null;

  function openSearchStep(step: SearchStep) {
    setActiveSearchStep(step);
    onSearchOpen(true);
  }

  function handleLocationSelect(value: string) {
    onQueryChange(value);
    openDateSearch();
  }

  function handleNearbySelect() {
    onQueryChange(t.search.nearbyQuery);
    onNearby();
    openDateSearch();
  }

  function openDateSearch() {
    setDatePickerMode("dates");
    openSearchStep("when");
  }

  function handleClearLocation() {
    setActiveSearchStep("where");
    onSearchReset();
  }

  useEffect(() => {
    if (!isSearchOpen) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      const searchElement = searchRef.current;
      if (!searchElement || searchElement.contains(event.target as Node)) return;

      onSearchOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isSearchOpen, onSearchOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      const authMenuElement = authMenuRef.current;
      if (!authMenuElement || authMenuElement.contains(event.target as Node)) return;

      setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [menuOpen]);

  return (
    <>
      <header className={`top-header${isScrolled ? " is-scrolled" : ""}${isSearchOpen ? " is-search-active" : ""}${isExperienceSearch ? " is-experience-search" : ""}`}>
        <nav className="header-inner" aria-label="Primary">
          <Link className="brand" href="/" aria-label="The Nomad Space home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M5 25.5V11.2L16 4l11 7.2v14.3h-5.8V14.7L16 11.3l-5.2 3.4v10.8H5Z" />
                <path d="M13.1 25.5V17h5.8v8.5h-5.8Z" />
              </svg>
            </span>
            <span>The Nomad Space</span>
          </Link>

          <div className="nomad-tabs" role="tablist" aria-label={t.nav.tabsLabel} ref={tabsRef}>
            {underlineStyle && (
              <span
                className="nomad-tab-underline"
                style={{ left: underlineStyle.left, width: underlineStyle.width, bottom: underlineStyle.bottom }}
                aria-hidden
              />
            )}
            {tabs.map((tab) => (
              <button
                className={`nomad-tab${activeCategory === tab.id ? " is-active" : ""}`}
                key={tab.id}
                onClick={() => onCategoryChange(tab.id)}
                role="tab"
                aria-selected={activeCategory === tab.id}
                type="button"
              >
                <span className="nomad-tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && <small>{tab.badge}</small>}
              </button>
            ))}
          </div>

          <div className="header-actions">
            <Link className="host-link hide-mobile" href="/auth">
              {session ? t.nav.hostMode : t.nav.host}
            </Link>

            {session ? (
              <Link className="account-avatar-button" href="/profile" aria-label={t.nav.profile}>
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <strong>{userInitial}</strong>
                )}
              </Link>
            ) : (
              <button
                className="theme-toggle"
                type="button"
                aria-label={t.nav.languageRegion}
                onClick={() => setLanguageOpen(true)}
              >
                <i className="bi bi-globe2" aria-hidden="true" />
              </button>
            )}

            <div className="auth-menu" ref={authMenuRef}>
              <button
                className="profile-button"
                type="button"
                aria-label={session ? t.nav.accountMenu : t.nav.signIn}
                aria-expanded={menuOpen}
                onClick={() => {
                  if (status === "loading") return;
                  setMenuOpen((value) => !value);
                }}
              >
                <i className="bi bi-list" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="auth-dropdown" role="menu">
                  {session ? (
                    <UserMenu
                      onClose={() => setMenuOpen(false)}
                      onLanguageOpen={() => {
                        setMenuOpen(false);
                        setLanguageOpen(true);
                      }}
                      onSignOut={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                    />
                  ) : (
                    <GuestMenu onClose={() => setMenuOpen(false)} />
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className={`search-morph${isSearchOpen ? " is-open" : ""}`} ref={searchRef}>
          <div className="search-pill" role="search" ref={pillRef}>
            {isSearchOpen && highlightStyle && (
              <span
                className="search-field-highlight"
                style={{ left: highlightStyle.left, width: highlightStyle.width }}
                aria-hidden
              />
            )}
            <div
              className={`search-field${activeField === "where" ? " is-active" : ""}${query ? " has-value" : ""}`}
              onClick={(e) => {
                const input = e.currentTarget.querySelector("input");
                if (!isSearchOpen) {
                  openSearchStep("where");
                  if (input) {
                    setTimeout(() => {
                      input.focus();
                    }, 50);
                  }
                } else {
                  if (input && document.activeElement !== input) {
                    input.focus();
                  }
                }
              }}
            >
              <span className="expanded-field-label">{t.search.where}</span>
              <input
                className="expanded-field-input"
                aria-label={t.search.destinationLabel}
                onChange={(event) => onQueryChange(event.target.value)}
                onFocus={() => openSearchStep("where")}
                placeholder={t.search.placeholder}
                value={query}
              />
              {activeField === "where" && (
                <button
                  className="field-clear-button"
                  type="button"
                  aria-label={t.search.clearWhere}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClearLocation();
                  }}
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              )}
              <span className="compact-field-label">
                <strong>{query || t.search.anyWhere}</strong>
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              className={`search-field hide-mobile${activeField === "when" ? " is-active" : ""}`}
              onClick={() => {
                if (isSearchOpen && activeSearchStep === "when") {
                  onSearchOpen(false);
                } else {
                  openDateSearch();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && (isSearchOpen && activeSearchStep === "when" ? onSearchOpen(false) : openDateSearch())}
            >
              <span className="expanded-field-label">{t.search.when}</span>
              <strong className="expanded-field-input">{dateSummary}</strong>
              {activeField === "when" && (
                <button
                  className="field-clear-button"
                  type="button"
                  aria-label="ล้างวันที่"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateChange(null);
                    openSearchStep("where");
                  }}
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              )}
              <span className="compact-field-label compact-field-labeled">
                <small>{t.detail.checkIn} / {t.detail.checkOut}</small>
                <strong>{compactDateSummary}</strong>
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              className={`search-field hide-mobile${activeField === "who" ? " is-active" : ""}`}
              onClick={() => {
                if (isSearchOpen && activeSearchStep === "who") {
                  onSearchOpen(false);
                } else {
                  openSearchStep("who");
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && (isSearchOpen && activeSearchStep === "who" ? onSearchOpen(false) : openSearchStep("who"))}
            >
              <span className="expanded-field-label">{rightSearchLabel}</span>
              <strong className="expanded-field-input">{rightSearchSummary}</strong>
              {activeField === "who" && (
                <button
                  className="field-clear-button"
                  type="button"
                  aria-label="ล้างจำนวนเกสต์"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSearchStep("where");
                  }}
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              )}
              <span className="compact-field-label compact-field-labeled">
                <small>{rightSearchLabel}</small>
                <strong>{rightSearchSummary}</strong>
              </span>
            </div>

            <button
              className="search-button"
              type="button"
              aria-label={t.search.submit}
              onClick={() => onSearchOpen(false)}
            >
              <i className="bi bi-search search-button-icon" aria-hidden="true" />
              <span className="expanded-search-label">{t.search.submit}</span>
            </button>
          </div>

          {isSearchOpen && activeSearchStep === "where" && (
            <div className="location-suggest-wrapper">
              <LocationSuggest
                query={query}
                onSelect={handleLocationSelect}
                onNearby={handleNearbySelect}
                variant={isExperienceSearch ? "experience" : "default"}
              />
            </div>
          )}

          {isSearchOpen && activeSearchStep === "when" && (
            <DatePickerPanel
              mode={datePickerMode}
              monthOffset={calendarOffset}
              selectedDate={selectedDate}
              selectedDateFlexIndex={selectedDateFlexIndex}
              selectedStayLengthIndex={selectedStayLengthIndex}
              flexibleMonthOffset={flexibleMonthOffset}
              selectedFlexibleMonth={selectedFlexibleMonth}
              onModeChange={setDatePickerMode}
              onMonthChange={setCalendarOffset}
              onDateFlexChange={setSelectedDateFlexIndex}
              onStayLengthChange={setSelectedStayLengthIndex}
              onFlexibleMonthOffsetChange={setFlexibleMonthOffset}
              onFlexibleMonthChange={setSelectedFlexibleMonth}
              onSelectDate={(date) => {
                onDateChange(date);
                openSearchStep("who");
              }}
            />
          )}

          {isSearchOpen && activeSearchStep === "who" && (
            isServiceSearch ? (
              <ServiceSelector
                selected={serviceType}
                onSelect={(key) => {
                  onServiceChange(key);
                  onSearchOpen(false);
                }}
              />
            ) : (
              <GuestSelector
                counts={guestCounts}
                onChange={onGuestChange}
                variant={isExperienceSearch ? "experience" : "default"}
              />
            )
          )}
        </div>
      </header>

      {isSearchOpen && (
        <button
          className="scrim"
          type="button"
          aria-label={t.search.close}
          onClick={() => onSearchOpen(false)}
        />
      )}

      {languageOpen && <LanguageModal onClose={() => setLanguageOpen(false)} />}
    </>
  );
}

function GuestMenu({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <>
      <Link className="auth-dropdown-item" href="/help" role="menuitem" onClick={onClose}>
        <BootstrapIcon name="bi-question-circle" />
        {t.nav.helpCenter}
      </Link>
      <hr className="auth-dropdown-divider" />
      <HostMenuLink onClose={onClose} />
      <hr className="auth-dropdown-divider" />
      <Link className="auth-dropdown-item" href="/co-hosts" role="menuitem" onClick={onClose}>
        {t.nav.findCoHost}
      </Link>
      <hr className="auth-dropdown-divider" />
      <Link className="auth-dropdown-item" href="/auth" role="menuitem" onClick={onClose}>
        {t.nav.loginRegister}
      </Link>
    </>
  );
}

function UserMenu({
  onClose,
  onLanguageOpen,
  onSignOut,
}: {
  onClose: () => void;
  onLanguageOpen: () => void;
  onSignOut: () => void;
}) {
  const { t } = useLanguage();
  const topItems = [
    { label: t.nav.wishlist, href: "/wishlist", icon: "bi-heart" },
    { label: t.nav.trips, href: "/trips", icon: "bi-geo-alt" },
    { label: t.nav.messages, href: "/messages", icon: "bi-chat-left" },
    { label: t.nav.profile, href: "/profile", icon: "bi-person" },
  ];

  return (
    <>
      {topItems.map((item) => (
        <Link className="auth-dropdown-item" href={item.href} role="menuitem" key={item.href} onClick={onClose}>
          <BootstrapIcon name={item.icon} />
          {item.label}
        </Link>
      ))}
      <hr className="auth-dropdown-divider" />
      <Link className="auth-dropdown-item" href="/notifications" role="menuitem" onClick={onClose}>
        <BootstrapIcon name="bi-bell" />
        {t.nav.notifications}
      </Link>
      <Link className="auth-dropdown-item" href="/account" role="menuitem" onClick={onClose}>
        <BootstrapIcon name="bi-gear" />
        {t.nav.accountSettings}
      </Link>
      <button className="auth-dropdown-item" type="button" role="menuitem" onClick={onLanguageOpen}>
        <BootstrapIcon name="bi-globe2" />
        {t.nav.languageCurrency}
      </button>
      <Link className="auth-dropdown-item" href="/help" role="menuitem" onClick={onClose}>
        <BootstrapIcon name="bi-question-circle" />
        {t.nav.helpCenter}
      </Link>
      <hr className="auth-dropdown-divider" />
      <HostMenuLink onClose={onClose} />
      <hr className="auth-dropdown-divider" />
      <Link className="auth-dropdown-item" href="/refer-host" role="menuitem" onClick={onClose}>
        {t.nav.referHost}
      </Link>
      <Link className="auth-dropdown-item" href="/co-hosts" role="menuitem" onClick={onClose}>
        {t.nav.findCoHost}
      </Link>
      <hr className="auth-dropdown-divider" />
      <button className="auth-dropdown-item" type="button" role="menuitem" onClick={onSignOut}>
        {t.nav.signOut}
      </button>
    </>
  );
}

function HostMenuLink({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <Link className="auth-dropdown-host" href="/auth" role="menuitem" onClick={onClose}>
      <span>
        <strong>{t.nav.hostStart}</strong>
        <small>{t.nav.hostSubtext}</small>
      </span>
      <span className="auth-dropdown-host-figure" aria-hidden="true">
        <i className="bi bi-person-standing" aria-hidden="true" />
      </span>
    </Link>
  );
}

function BootstrapIcon({ name }: { name: string }) {
  return <i className={`bi ${name}`} aria-hidden="true" />;
}

function DatePickerPanel({
  mode,
  monthOffset,
  selectedDate,
  selectedDateFlexIndex,
  selectedStayLengthIndex,
  flexibleMonthOffset,
  selectedFlexibleMonth,
  onModeChange,
  onMonthChange,
  onDateFlexChange,
  onStayLengthChange,
  onFlexibleMonthOffsetChange,
  onFlexibleMonthChange,
  onSelectDate,
}: {
  mode: DatePickerMode;
  monthOffset: number;
  selectedDate: Date | null;
  selectedDateFlexIndex: number;
  selectedStayLengthIndex: number;
  flexibleMonthOffset: number;
  selectedFlexibleMonth: Date;
  onModeChange: (mode: DatePickerMode) => void;
  onMonthChange: (nextOffset: number) => void;
  onDateFlexChange: (index: number) => void;
  onStayLengthChange: (index: number) => void;
  onFlexibleMonthOffsetChange: (offset: number) => void;
  onFlexibleMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const { t } = useLanguage();
  const firstMonth = addMonths(CALENDAR_START_DATE, monthOffset);
  const secondMonth = addMonths(CALENDAR_START_DATE, monthOffset + 1);
  return (
    <div className="date-picker-panel" role="dialog" aria-label={t.datePicker.label}>
      <div className="date-picker-tabs" role="tablist" aria-label={t.datePicker.typeLabel}>
        <button
          className={mode === "dates" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={mode === "dates"}
          onClick={() => onModeChange("dates")}
        >
          {t.datePicker.dates}
        </button>
        <button
          className={mode === "flexible" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={mode === "flexible"}
          onClick={() => onModeChange("flexible")}
        >
          {t.datePicker.flexible}
        </button>
      </div>

      {mode === "dates" ? (
        <>
          <div className="calendar-shell">
            <button
              className="calendar-nav calendar-nav-prev"
              type="button"
              aria-label={t.datePicker.prevMonth}
              disabled={monthOffset === 0}
              onClick={() => onMonthChange(Math.max(0, monthOffset - 1))}
            >
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <CalendarMonth monthDate={firstMonth} selectedDate={selectedDate} onSelectDate={onSelectDate} />
            <CalendarMonth monthDate={secondMonth} selectedDate={selectedDate} onSelectDate={onSelectDate} />
            <button
              className="calendar-nav calendar-nav-next"
              type="button"
              aria-label={t.datePicker.nextMonth}
              onClick={() => onMonthChange(monthOffset + 1)}
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div className="flexible-date-options" aria-label={t.datePicker.flexibleLabel}>
            {t.datePicker.flexibleDateOptions.map((option, index) => (
              <button
                className={selectedDateFlexIndex === index ? "is-active" : ""}
                type="button"
                key={option}
                aria-pressed={selectedDateFlexIndex === index}
                onClick={() => onDateFlexChange(index)}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : (
        <FlexibleStayPanel
          selectedStayLengthIndex={selectedStayLengthIndex}
          flexibleMonthOffset={flexibleMonthOffset}
          selectedFlexibleMonth={selectedFlexibleMonth}
          onStayLengthChange={onStayLengthChange}
          onFlexibleMonthOffsetChange={onFlexibleMonthOffsetChange}
          onFlexibleMonthChange={onFlexibleMonthChange}
        />
      )}
    </div>
  );
}

function FlexibleStayPanel({
  selectedStayLengthIndex,
  flexibleMonthOffset,
  selectedFlexibleMonth,
  onStayLengthChange,
  onFlexibleMonthOffsetChange,
  onFlexibleMonthChange,
}: {
  selectedStayLengthIndex: number;
  flexibleMonthOffset: number;
  selectedFlexibleMonth: Date;
  onStayLengthChange: (index: number) => void;
  onFlexibleMonthOffsetChange: (offset: number) => void;
  onFlexibleMonthChange: (month: Date) => void;
}) {
  const { t } = useLanguage();
  const visibleMonths = buildFlexibleMonths(flexibleMonthOffset);

  return (
    <div className="flexible-stay-panel">
      <section className="flexible-stay-section" aria-labelledby="stay-length-heading">
        <h3 id="stay-length-heading">{t.datePicker.stayLengthTitle}</h3>
        <div className="stay-length-options">
          {t.datePicker.stayLengths.map((option, index) => (
            <button
              className={selectedStayLengthIndex === index ? "is-active" : ""}
              type="button"
              key={option}
              aria-pressed={selectedStayLengthIndex === index}
              onClick={() => onStayLengthChange(index)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="flexible-stay-section" aria-labelledby="stay-month-heading">
        <h3 id="stay-month-heading">{t.datePicker.stayMonthTitle}</h3>
        <div className="month-card-row">
          {visibleMonths.map((month) => (
            <button
              className={`month-card${isSameDate(month, selectedFlexibleMonth) ? " is-active" : ""}`}
              type="button"
              key={dateKey(month)}
              aria-pressed={isSameDate(month, selectedFlexibleMonth)}
              onClick={() => onFlexibleMonthChange(month)}
            >
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="6" y="8" width="20" height="18" rx="2" />
                <path d="M10 5v6M22 5v6M6 13h20" />
              </svg>
              <span>{t.datePicker.months[month.getMonth()]}</span>
              <small>{month.getFullYear()}</small>
            </button>
          ))}
          <button
            className="month-scroll-button"
            type="button"
            aria-label={t.datePicker.nextMonth}
            onClick={() => onFlexibleMonthOffsetChange(flexibleMonthOffset + 1)}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

function CalendarMonth({
  monthDate,
  selectedDate,
  onSelectDate,
}: {
  monthDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const { t } = useLanguage();
  const calendarDays = buildCalendarDays(monthDate);
  const monthName = t.datePicker.months[monthDate.getMonth()];

  return (
    <section className="calendar-month" aria-label={`${monthName} ${monthDate.getFullYear()}`}>
      <h3>{monthName} {monthDate.getFullYear()}</h3>
      <div className="calendar-weekdays">
        {t.datePicker.weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {calendarDays.map((day, index) => {
          if (!day) return <span className="calendar-empty-day" key={`empty-${index}`} />;

          const disabled = day < MIN_SELECTABLE_DATE;
          const selected = Boolean(selectedDate && isSameDate(day, selectedDate));

          return (
            <button
              className={selected ? "is-selected" : ""}
              type="button"
              key={dateKey(day)}
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelectDate(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function GuestSelector({
  counts,
  onChange,
  variant,
}: {
  counts: GuestCounts;
  onChange: (type: GuestType, delta: 1 | -1) => void;
  variant?: "default" | "experience";
}) {
  const { t } = useLanguage();
  const rows = variant === "experience"
    ? t.guests.rows.filter((row) => row.type !== "pets")
    : t.guests.rows;

  return (
    <div className={`guest-selector${variant === "experience" ? " is-experience" : ""}`} role="dialog" aria-label={t.guests.label}>
      {rows.map((row) => {
        const minimumCount = 0;
        const count = counts[row.type];

        return (
          <div className="guest-counter-row" key={row.type}>
            <div className="guest-counter-copy">
              <strong>{row.label}</strong>
              <span>{row.description}</span>
              {"extra" in row && row.extra && <button type="button">{row.extra}</button>}
            </div>
            <div className="guest-counter-controls">
              <button
                type="button"
                aria-label={`${t.guests.decrease}${row.label}`}
                disabled={count <= minimumCount}
                onClick={() => onChange(row.type, -1)}
              >
                <i className="bi bi-dash-lg" aria-hidden="true" />
              </button>
              <span aria-live="polite">{count}</span>
              <button
                type="button"
                aria-label={`${t.guests.increase}${row.label}`}
                onClick={() => onChange(row.type, 1)}
              >
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiceSelector({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="service-selector" role="dialog" aria-label={t.search.serviceType}>
      {t.search.serviceOptions.map((option) => (
        <button
          className={`service-option${selected === option.key ? " is-active" : ""}`}
          key={option.key}
          type="button"
          onClick={() => onSelect(selected === option.key ? null : option.key)}
        >
          <i className={`bi ${option.icon}`} aria-hidden="true" />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
}

function buildFlexibleMonths(offset: number) {
  return Array.from({ length: 6 }, (_, index) => addMonths(CALENDAR_START_DATE, offset + index));
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDate(firstDate: Date, secondDate: Date) {
  return dateKey(firstDate) === dateKey(secondDate);
}

function formatSearchDate(date: Date, shortMonths: readonly string[]) {
  return `${date.getDate()} ${shortMonths[date.getMonth()]}`;
}

function getUserInitial(value: string | null | undefined) {
  return (value?.trim().charAt(0) || "U").toUpperCase();
}

function getGuestSearchCount(guestCounts: GuestCounts) {
  return guestCounts.adults + guestCounts.children + guestCounts.infants;
}
