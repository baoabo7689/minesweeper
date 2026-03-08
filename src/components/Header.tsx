'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

import ContactButton from './ContactButton';
import LanguageButton from './LanguageButton';
import HelpIcon from './HelpButton';

export default function Header() {
  const { translations } = useLanguage();

  return (
    <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200">
      <div className="flex-1">
        <Link href="/">
          <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200">
            {translations.header.title}
          </h1>
        </Link>
      </div>

      <nav className="flex items-center gap-6">
        <LanguageButton />
        <HelpIcon />
        <ContactButton />
      </nav>
    </header>
  );
}
