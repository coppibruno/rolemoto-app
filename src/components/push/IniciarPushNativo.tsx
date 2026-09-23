"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export const IniciarPushNativo = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    void import("@/lib/fcm-nativo").then((mod) => {
      mod.iniciarListenersNativos();
    });
  }, []);

  return null;
};
