import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Account Management System",
    template: "%s | Account Management System",
  },
  description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
  keywords: ["account management", "RBAC", "supabase", "next.js", "audit logs"],
  authors: [{ name: "Zefan" }],
  creator: "Zefan",
  publisher: "Zefan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/Zefansstr/Account-Manager-System",
    siteName: "Account Management System",
    title: "Account Management System",
    description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Account Management System",
    description: "Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
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

