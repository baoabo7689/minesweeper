'use client';

import React from 'react';

import { useLanguage } from '@/context/LanguageContext';

export default function HelpPage() {
  const { translations } = useLanguage();
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{translations.help?.title}</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{translations.help?.common}</h2>
        <ul className="list-disc pl-6 text-lg">
          {translations.help?.commonHelps?.map((help: string, idx: number) => (
            <li key={idx}>{help}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
