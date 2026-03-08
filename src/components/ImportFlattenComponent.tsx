'use client';

import { useState } from 'react';

import type { CubeModel } from '@/models/CubeModel';
import { parseFlattenViewFromString } from '@/components/FlattenCubeComponent';

interface ImportFlattenComponentProps {
  onImport: (cube: CubeModel) => void;
  onClose: () => void;
}

export default function ImportFlattenComponent({ onImport, onClose }: ImportFlattenComponentProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cube = parseFlattenViewFromString(text);
    if (!cube) {
      setError('Invalid format. Please paste a valid flatten view string.');
      return;
    }
    onImport(cube);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[560px] max-w-full rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Import Flatten View</h2>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-800 outline-none ring-offset-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          rows={16}
          placeholder={
            'Paste flatten view string here.\n\nFormat:\n  x x | x | ? ? ? | x\n  ? ? | ? | ? ? ? | ?\n  x x | x | ? ? ? | x'
          }
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="btn-blue h-9">
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
