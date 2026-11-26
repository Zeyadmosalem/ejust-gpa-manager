"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production builds. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      /* offline support is optional */
    });
  }, []);
  return null;
}
