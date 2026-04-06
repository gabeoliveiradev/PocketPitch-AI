import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PocketPitch AI — Seu Co-Piloto de Vendas",
  description:
    "Assistente de IA especialista em vendas. Crie pitches, contorne objeções e feche mais negócios com inteligência artificial.",
  keywords: ["vendas", "IA", "pitch", "inteligência artificial", "PocketPitch"],
  authors: [{ name: "PocketPitch AI" }],
  openGraph: {
    title: "PocketPitch AI — Seu Co-Piloto de Vendas",
    description:
      "Assistente de IA especialista em vendas. Crie pitches, contorne objeções e feche mais negócios.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
