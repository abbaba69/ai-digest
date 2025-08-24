import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI Daily Digest',
  description: 'Yesterday’s top AI news, updated daily (IST).'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
