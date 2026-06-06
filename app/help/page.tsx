"use client";

import { SimpleInfoPage } from "@/components/SimpleInfoPage";
import { useLanguage } from "@/lib/i18n";

export default function HelpPage() {
  const { t } = useLanguage();

  return <SimpleInfoPage title={t.nav.helpCenter} description={t.help.description} />;
}
