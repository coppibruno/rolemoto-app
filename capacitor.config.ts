import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://rolemoto.com.br";
const usaHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "br.com.rolemoto.app",
  appName: "Rolemoto",
  webDir: "public",
  android: {
    useLegacyBridge: true,
  },
  server: {
    url: serverUrl,
    cleartext: usaHttp,
  },
};

export default config;
