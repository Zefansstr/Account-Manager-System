import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "NexGate",
    template: "%s | NexGate",
  },
  description: "NexGate - Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
  keywords: ["account management", "RBAC", "supabase", "next.js", "audit logs"],
  authors: [{ name: "Zefan" }],
  creator: "Zefan",
  publisher: "Zefan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/Zefansstr/Account-Manager-System",
    siteName: "NexGate",
    title: "NexGate",
    description: "NexGate - Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexGate",
    description: "NexGate - Full-stack Account Management System with RBAC, Data Filtering, and Audit Logs",
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

