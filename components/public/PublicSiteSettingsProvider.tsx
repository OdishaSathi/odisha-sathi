"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  fallbackPublicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/publicSiteSettings";

const PublicSiteSettingsContext = createContext<PublicSiteSettings>(fallbackPublicSiteSettings);

export default function PublicSiteSettingsProvider({
  children,
  initialSettings = fallbackPublicSiteSettings,
}: {
  children: ReactNode;
  initialSettings?: PublicSiteSettings;
}) {
  return (
    <PublicSiteSettingsContext.Provider value={initialSettings}>
      {children}
    </PublicSiteSettingsContext.Provider>
  );
}

export function usePublicSiteSettings() {
  return useContext(PublicSiteSettingsContext);
}
