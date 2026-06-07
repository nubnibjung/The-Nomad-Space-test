"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n";

const PRESET_AVATARS = [
  "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='50' fill='%23FF5A5F'/><path d='M30 40 L40 25 L50 40 L60 25 L70 40 C75 55 75 75 50 80 C25 75 25 55 30 40 Z' fill='%23FFFFFF'/><circle cx='42' cy='52' r='4' fill='%23FF5A5F'/><circle cx='58' cy='52' r='4' fill='%23FF5A5F'/><path d='M46 62 Q50 65 54 62' stroke='%23FF5A5F' stroke-width='2' fill='none'/></svg>",
  "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='50' fill='%2300A699'/><path d='M30 35 L70 35 C80 50 80 70 50 78 C20 70 20 50 30 35 Z' fill='%23FFFFFF'/><path d='M22 30 C20 40 26 50 28 45 L32 36 Z' fill='%23484848'/><path d='M78 30 C80 40 74 50 72 45 L68 36 Z' fill='%23484848'/><circle cx='40' cy='48' r='4' fill='%2300A699'/><circle cx='60' cy='48' r='4' fill='%2300A699'/><polygon points='46,56 54,56 50,60' fill='%23484848'/></svg>",
  "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='50' fill='%23FC642D'/><circle cx='50' cy='52' r='25' fill='%23FFFFFF'/><circle cx='32' cy='34' r='10' fill='%23484848'/><circle cx='68' cy='34' r='10' fill='%23484848'/><ellipse cx='42' cy='48' rx='5' ry='7' fill='%23484848'/><ellipse cx='58' cy='48' rx='5' ry='7' fill='%23484848'/><circle cx='43' cy='46' r='2' fill='%23FFFFFF'/><circle cx='57' cy='46' r='2' fill='%23FFFFFF'/><polygon points='47,56 53,56 50,59' fill='%23484848'/></svg>",
  "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='50' fill='%237B0099'/><path d='M25 45 L50 20 L75 45 C75 65 65 75 50 78 C35 75 25 65 25 45 Z' fill='%23FF7E00'/><path d='M50 55 L25 45 C28 65 38 75 50 78 Z' fill='%23FFFFFF'/><path d='M50 55 L75 45 C72 65 62 75 50 78 Z' fill='%23FFFFFF'/><circle cx='40' cy='46' r='4' fill='%237B0099'/><circle cx='60' cy='46' r='4' fill='%237B0099'/><circle cx='50' cy='73' r='5' fill='%23484848'/></svg>",
];

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { t, locale } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [hasChangedImage, setHasChangedImage] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setSelectedImage(session.user.image || "");
      setHasChangedImage(false);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <main className="profile-wrapper">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <div className="results-searching">{t.results.searching}</div>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="profile-wrapper">
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <h1 style={{ fontSize: "28px", marginBottom: "16px" }}>{t.nav.profile}</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>{t.nav.loginRegister}</p>
          <Link href="/auth" className="profile-btn-primary" style={{ textDecoration: "none", margin: "0 auto" }}>
            {t.nav.signIn}
          </Link>
        </div>
      </main>
    );
  }

  const openEditProfileModal = () => {
    setName(session?.user?.name || "");
    setSelectedImage(session?.user?.image || "");
    setHasChangedImage(false);
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const closeEditProfileModal = () => {
    if (isPending) return;

    setName(session?.user?.name || "");
    setSelectedImage(session?.user?.image || "");
    setHasChangedImage(false);
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg(locale === "th" ? "ขนาดไฟล์ต้องไม่เกิน 2MB" : "File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setHasChangedImage(true);
      setErrorMsg("");
    };

    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (avatarUrl: string) => {
    setSelectedImage(avatarUrl);
    setHasChangedImage(true);
    setErrorMsg("");
  };

  const handleSave = () => {
    setErrorMsg("");
    setSuccessMsg("");

    // Empty name falls back to the existing one (the input already shows it as
    // a placeholder), so saving never wipes the profile name.
    const nextName = name.trim() || session?.user?.name || "";

    // Only send an image when the user actually picked a new one. Otherwise we
    // omit it so the server keeps the current avatar — `session.user.image` is
    // a proxy URL (/api/profile/image?...), not the real source, so re-sending
    // it would overwrite the stored data URI with an unusable value.
    const nextImage = hasChangedImage && selectedImage.trim() ? selectedImage : undefined;

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nextName,
            ...(nextImage !== undefined ? { image: nextImage } : {}),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        await update({
          name: nextName,
          ...(nextImage !== undefined ? { image: nextImage } : {}),
        });

        setSuccessMsg(locale === "th" ? "บันทึกโปรไฟล์เรียบร้อยแล้ว!" : "Profile saved successfully!");
        setHasChangedImage(false);

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg("");
        }, 1200);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save profile");
      }
    });
  };

  const userInitial = (session?.user?.name || session?.user?.email || "U").substring(0, 1).toUpperCase();

  return (
    <main className="profile-wrapper">
      <div className="profile-header-nav">
        <Link className="simple-page-back" href="/">
          The Nomad Space
        </Link>
      </div>

      <div className="profile-grid">
        <div className="profile-card-left">
          <div className="profile-avatar-wrapper" onClick={openEditProfileModal}>
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} className="profile-avatar-image" alt="Profile" />
            ) : (
              <div className="profile-avatar-fallback">{userInitial}</div>
            )}

            <div className="profile-avatar-hover">
              <i className="bi bi-camera-fill" style={{ fontSize: "20px" }} />
              <span>{locale === "th" ? "แก้ไขรูปภาพ" : "Change photo"}</span>
            </div>
          </div>

          <h2 className="profile-name-title">{session?.user?.name}</h2>
          <span className="profile-role-badge">
            {locale === "th" ? "สมาชิก The Nomad Space" : "The Nomad Space Member"}
          </span>

          <div className="profile-stats">
            <div className="profile-stat-row">
              <span className="profile-stat-label">{locale === "th" ? "ยืนยันตัวตนแล้ว" : "Identity verified"}</span>
              <span className="profile-stat-val" style={{ color: "#008489" }}>
                <i className="bi bi-patch-check-fill" style={{ marginRight: "4px" }} />
                {locale === "th" ? "ใช่" : "Yes"}
              </span>
            </div>

            <div className="profile-stat-row">
              <span className="profile-stat-label">{locale === "th" ? "ระยะเวลาที่เป็นสมาชิก" : "Years on platform"}</span>
              <span className="profile-stat-val">{locale === "th" ? "ใหม่" : "New member"}</span>
            </div>
          </div>
        </div>

        <div className="profile-card-right">
          <div className="profile-welcome-section">
            <h1>
              {locale === "th"
                ? `สวัสดี ฉันชื่อ ${session?.user?.name || "เกสต์"}`
                : `Hi, I'm ${session?.user?.name || "Guest"}`}
            </h1>

            <p>
              {locale === "th"
                ? "ยินดีต้อนรับสู่โปรไฟล์ส่วนตัวของคุณ จัดการชื่อ ข้อมูลติดต่อ และภาพโปรไฟล์เพื่อให้นักเดินทางท่านอื่นรู้จักคุณดีขึ้น"
                : "Welcome to your personal profile. Manage your name, contact information, and avatar image to help other members get to know you better."}
            </p>
          </div>

          <div className="profile-details-box">
            <h3 className="profile-details-title">{locale === "th" ? "ข้อมูลโปรไฟล์ของคุณ" : "Your profile details"}</h3>

            <div className="profile-detail-item">
              <span className="profile-detail-label">{t.auth.name}</span>
              <span className="profile-detail-value">{session?.user?.name}</span>
            </div>

            <div className="profile-detail-item">
              <span className="profile-detail-label">{t.auth.email}</span>
              <span className="profile-detail-value">{session?.user?.email}</span>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button className="profile-edit-btn" onClick={openEditProfileModal}>
                <i className="bi bi-pencil" />
                {locale === "th" ? "แก้ไขโปรไฟล์" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="profile-modal-overlay" onClick={closeEditProfileModal}>
          <div className="profile-modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>{locale === "th" ? "แก้ไขข้อมูลโปรไฟล์" : "Edit profile details"}</h2>

              <button className="profile-modal-close" onClick={closeEditProfileModal} aria-label="Close" disabled={isPending}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="profile-modal-body">
              {errorMsg && (
                <div
                  style={{
                    color: "#FF385C",
                    background: "#FFF0F2",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <i className="bi bi-exclamation-circle-fill" style={{ marginRight: "6px" }} />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    color: "#008489",
                    background: "#E6F7F7",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  <i className="bi bi-check-circle-fill" style={{ marginRight: "6px" }} />
                  {successMsg}
                </div>
              )}

              <div className="profile-form-group">
                <label htmlFor="profile-name-input">{t.auth.name}</label>
                <input
                  id="profile-name-input"
                  type="text"
                  className="profile-form-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={session?.user?.name || t.auth.namePlaceholder}
                  disabled={isPending}
                />
              </div>

              <div>
                <span className="avatar-selector-label">
                  {locale === "th" ? "เลือกรูปภาพโปรไฟล์สำเร็จรูป" : "Choose a preset avatar"}
                </span>

                <div className="avatar-preset-grid">
                  {PRESET_AVATARS.map((avatarUrl, idx) => (
                    <button
                      key={idx}
                      className={`avatar-preset-btn${selectedImage === avatarUrl ? " is-selected" : ""}`}
                      onClick={() => handleSelectPresetAvatar(avatarUrl)}
                      type="button"
                      disabled={isPending}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt={`Preset ${idx + 1}`} className="avatar-preset-img" />
                    </button>
                  ))}
                </div>

                <div className="avatar-upload-divider">{locale === "th" ? "หรือ" : "or"}</div>

                <div className="avatar-file-input-wrapper">
                  <span className="avatar-selector-label">
                    {locale === "th" ? "อัปโหลดรูปภาพของคุณเอง" : "Upload your own photo"}
                  </span>

                  <label className="avatar-file-label-btn">
                    <i className="bi bi-upload" />
                    <span>{locale === "th" ? "เลือกไฟล์จากคอมพิวเตอร์" : "Choose file from computer"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="avatar-file-input"
                      onChange={handleFileChange}
                      disabled={isPending}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button className="profile-btn-secondary" onClick={closeEditProfileModal} disabled={isPending}>
                {locale === "th" ? "ยกเลิก" : "Cancel"}
              </button>

              <button className="profile-btn-primary" onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <i className="bi bi-hourglass-split" />
                    <span>{t.auth.submitting}</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-save" />
                    <span>{locale === "th" ? "บันทึก" : "Save"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}