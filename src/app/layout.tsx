import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolemoto App",
  description: "Rolemoto App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
