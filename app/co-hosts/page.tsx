"use client";

import { SimpleInfoPage } from "@/components/SimpleInfoPage";
import { useLanguage } from "@/lib/i18n";

export default function CoHostsPage() {
  const { t } = useLanguage();

  return <SimpleInfoPage title={t.nav.findCoHost} description={t.coHosts.description} />;
}
