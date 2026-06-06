"use client";

import { SimpleInfoPage } from "@/components/SimpleInfoPage";
import { useLanguage } from "@/lib/i18n";

export default function NotificationsPage() {
  const { t } = useLanguage();
  return <SimpleInfoPage title={t.nav.notifications} />;
}
