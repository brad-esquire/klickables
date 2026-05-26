import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Klickables — 3D Printed Fidget Clickers",
    template: "%s — Klickables",
  },
  description:
    "Handcrafted 3D printed fidget clickers by Kirra, Lorelei, Isla & Ashley. Satisfying, colorful clickers for focus, stress relief, and everyday fidgeting.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Klickables",
    title: "Klickables — 3D Printed Fidget Clickers",
    description:
      "Handcrafted 3D printed fidget clickers — satisfying, colorful, made by hand.",
    url: SITE_URL,
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Klickables" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Klickables — 3D Printed Fidget Clickers",
    description:
      "Handcrafted 3D printed fidget clickers — satisfying, colorful, made by hand.",
    images: ["/icon.png"],
  },
  robots: { index: true, follow: true },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Klickables",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  founders: [
    { "@type": "Person", name: "Kirra" },
    { "@type": "Person", name: "Lorelei" },
    { "@type": "Person", name: "Isla" },
    { "@type": "Person", name: "Ashley" },
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Klickables",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col antialiased">
          <GoogleAnalytics />
          <JsonLd data={organizationLd} />
          <JsonLd data={websiteLd} />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
    </html>
  );
}
