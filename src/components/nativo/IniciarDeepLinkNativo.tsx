"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export const IniciarDeepLinkNativo = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    void import("@/lib/deep-link-nativo").then((mod) => {
      mod.iniciarDeepLinksNativos();
    });
  }, []);

  return null;
};
