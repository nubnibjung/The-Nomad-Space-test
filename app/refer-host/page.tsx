"use client";

import { SimpleInfoPage } from "@/components/SimpleInfoPage";
import { useLanguage } from "@/lib/i18n";

export default function ReferHostPage() {
  const { t } = useLanguage();
  return <SimpleInfoPage title={t.nav.referHost} />;
}
