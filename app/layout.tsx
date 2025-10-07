import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Account Management System",
  description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
  keywords: ["account management", "RBAC", "supabase", "next.js", "audit logs"],
  authors: [{ name: "Zefan" }],
  creator: "Zefan",
  publisher: "Zefan",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/Zefansstr/Account-Manager-System",
    siteName: "Account Management System",
    title: "Account Management System",
    description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Account Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Account Management System",
    description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

