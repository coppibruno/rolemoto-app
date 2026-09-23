import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { IniciarPushNativo } from "@/components/push/IniciarPushNativo";
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
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <AuthProvider>
          <IniciarPushNativo />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
