import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FRACTARC | AI Fracture Intelligence',
  description: 'Enterprise-grade AI fracture analysis platform for X-ray imaging.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
