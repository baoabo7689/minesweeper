'use client';

import type { CellValueType } from '@/consts/minesweeper_types';
import { Bomb, Flag as FlagIcon } from 'lucide-react';

export type SelectableCellValue = Extract<
  CellValueType,
  'Flag' | 'Bomb' | 'Empty' | 'Undetermined'
>;

interface CellValueSelectorProps {
  value: SelectableCellValue;
  onChange: (value: SelectableCellValue) => void;
  className?: string;
}

const OPTIONS: Array<{ value: SelectableCellValue; label: string; icon?: React.ReactNode }> = [
  { value: 'Flag', label: 'Flag', icon: <FlagIcon className="h-4 w-4" /> },
  { value: 'Bomb', label: 'Bomb', icon: <Bomb className="h-4 w-4" /> },
  { value: 'Empty', label: 'Empty' },
  { value: 'Undetermined', label: 'Undetermined' },
];

export default function CellValueSelector({
  value,
  onChange,
  className = '',
}: CellValueSelectorProps) {
  return (
    <div
      className={`inline-flex min-w-[384px] rounded-md border border-gray-300 overflow-hidden ${className}`}
      role="group"
      aria-label="Cell value selector"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        const colorClass =
          option.value === 'Bomb'
            ? isActive
              ? 'bg-red-600 text-white'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
            : option.value === 'Flag'
              ? isActive
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              : option.value === 'Undetermined'
                ? isActive
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                : isActive
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200';

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-32 px-3 py-2 text-right text-sm font-medium transition-colors inline-flex items-center justify-end gap-2 ${colorClass}`}
            aria-pressed={isActive}
            aria-label={option.label}
          >
            {option.icon ?? <span className="h-4 w-4" aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
