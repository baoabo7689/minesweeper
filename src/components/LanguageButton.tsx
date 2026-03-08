'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import Flag from 'react-flagkit';
import { useLanguage } from '@/context/LanguageContext';
export default function LanguageButton() {
  const { language, translations, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = (newLanguage: 'en' | 'vi') => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        title={translations.header.toggleLanguage}
        aria-label={translations.header.language}
        type="button"
      >
        <Globe className="w-5 h-5 text-gray-600" />
        <span className="text-lg font-medium hidden sm:inline">
          <Flag country={language === 'en' ? 'US' : 'VN'} size={20} />
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <button
            onClick={() => changeLanguage('en')}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${language === 'en' ? 'font-bold' : ''}`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('vi')}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${language === 'vi' ? 'font-bold' : ''}`}
          >
            Tiếng Việt
          </button>
        </div>
      )}
    </div>
  );
}
