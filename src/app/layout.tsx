import type { Metadata } from 'next';
import '../../public/styles/globals.css';
import Header from '@/components/Header';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'NextJS Template',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
