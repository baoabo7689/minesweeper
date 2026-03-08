'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { translations } = useLanguage();

  return (
    <main className="flex-1 bg-gradient-to-br from-blue-100 via-white to-pink-100">
      <section className="w-full h-full border border-gray-200 bg-white shadow-xl pl-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.home.title}</h1>
        <p className="mt-2 text-gray-600">{translations.home.description}</p>
      </section>
    </main>
  );
}
