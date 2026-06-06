"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type AuthMode = "login" | "register";

const posterCities = [
  "Paris",
  "Bangkok",
  "Tokyo",
  "Miami",
  "Osaka",
  "Seoul",
  "London",
  "Sydney",
  "Chiang Mai",
  "Phuket",
];

export default function AuthPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

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
      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="auth-page">
      <div className="auth-poster-grid" aria-hidden="true">
        {posterCities.map((city) => (
          <span key={city}>{city}</span>
        ))}
      </div>

      <section className="auth-panel" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/" aria-label="The Nomad Space home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M5 25.5V11.2L16 4l11 7.2v14.3h-5.8V14.7L16 11.3l-5.2 3.4v10.8H5Z" />
            <path d="M13.1 25.5V17h5.8v8.5h-5.8Z" />
          </svg>
          The Nomad Space
        </Link>

        <h1 id="auth-title">{t.auth.title}</h1>

        <div className="auth-mode-tabs" role="tablist" aria-label={t.auth.modeLabel}>
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

        <form className="auth-form" onSubmit={handleSubmit}>
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

          {message && <p className="auth-message">{message}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.auth.submitting : mode === "register" ? t.auth.register : t.auth.login}
          </button>
        </form>
      </section>
    </main>
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
