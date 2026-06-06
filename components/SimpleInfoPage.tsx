"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

type Props = {
  title: string;
  description?: string;
};

export function SimpleInfoPage({ title, description }: Props) {
  const { t } = useLanguage();

  return (
    <main className="simple-page">
      <Link className="simple-page-back" href="/">The Nomad Space</Link>
      <section>
        <h1>{title}</h1>
        <p>{description ?? t.placeholder.description}</p>
      </section>
    </main>
  );
}
