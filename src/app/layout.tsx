import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Budget Tracker 2026',
  description: 'Private, mobile-first 2026 personal budget tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
