import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./nocturne.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "klicka. — prospecção local",
  description:
    "Escolha um nicho e uma cidade e receba os contatos das empresas locais: telefone, site, nota e avaliações.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
