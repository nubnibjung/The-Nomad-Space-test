"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";

type AuthMode = "login" | "register";

type Props = {
  onClose: () => void;
};

export function AuthPromptModal({ onClose }: Props) {
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
        const isRegistered = await registerUser();
        if (!isRegistered) return;
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

  async function registerUser() {
    if (!email.includes("@")) {
      setMessage(t.auth.invalidEmail);
      return false;
    }

    if (password.length < 6) {
      setMessage(t.auth.shortPassword);
      return false;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      setMessage(getRegisterErrorMessage(response.status, t.auth));
      return false;
    }

    return true;
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <div className="auth-prompt-backdrop" role="presentation">
      <section className="auth-prompt-modal" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title">
        <button className="auth-prompt-close" type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <span className="auth-prompt-brand" aria-hidden="true">
          <i className="bi bi-house-door-fill" aria-hidden="true" />
        </span>

        <h2 id="auth-prompt-title">{t.auth.title}</h2>

        <div className="auth-prompt-tabs" role="tablist" aria-label={t.auth.modeLabel}>
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

        <form className="auth-prompt-form" onSubmit={handleSubmit}>
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

          {message && <p className="auth-prompt-message">{message}</p>}

          <button className="auth-prompt-submit" type="submit" disabled={isSubmitting}>
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
