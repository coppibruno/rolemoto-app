import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://www.rolemoto.com.br";
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
    // Apex (sem www) redireciona 308 → www; sem isso o Android abre o Chrome.
    allowNavigation: [
      "rolemoto.com.br",
      "www.rolemoto.com.br",
      "*.rolemoto.com.br",
      "*.firebaseapp.com",
      "*.googleapis.com",
      "accounts.google.com",
    ],
  },
};

export default config;
