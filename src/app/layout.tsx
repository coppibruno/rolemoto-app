import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { IniciarDeepLinkNativo } from "@/components/nativo/IniciarDeepLinkNativo";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TemaProvider } from "@/components/providers/TemaProvider";
import { IniciarPushNativo } from "@/components/push/IniciarPushNativo";
import { scriptTema } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolê Moto",
  description: "Encontre e organize rolês de moto com outros motociclistas",
  applicationName: "Rolê Moto",
  appleWebApp: {
    capable: true,
    title: "Rolê Moto",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon-rolemoto.svg", type: "image/svg+xml" }],
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#121316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <Script id="tema-inicial" strategy="beforeInteractive">
          {scriptTema}
        </Script>
        <TemaProvider>
          <AuthProvider>
            <IniciarPushNativo />
            <IniciarDeepLinkNativo />
            {children}
          </AuthProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
