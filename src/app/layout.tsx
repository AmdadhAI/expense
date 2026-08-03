import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/pwa/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'Budget Tracker 2026',
  description: 'Private 2026 personal budget tracker & PWA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Budget 2026',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400" suppressHydrationWarning>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
