'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { HelpCircle } from 'lucide-react';

export default function HelpIcon() {
  const { translations } = useLanguage();
  return (
    <a href="./help" className="flex items-center text-blue-600 hover:underline font-medium" title={translations.header.help}>
      <HelpCircle className="h-5 w-5 mr-1" />
    </a>
  );
};

