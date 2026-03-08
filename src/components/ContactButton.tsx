'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Mail } from 'lucide-react';

export default function ContactButton() {
  const { translations } = useLanguage();

  return (
    <a
      href={process.env.NEXT_PUBLIC_CONTACT_URL || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      title={translations.header.contact}
      aria-label={translations.header.contact}
    >
      <Mail className="w-5 h-5 text-gray-600" />
    </a>
  );
}
