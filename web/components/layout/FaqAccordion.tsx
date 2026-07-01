'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Accessible accordion for the /faq page. One item open at a time — clicking
 * an open item collapses it. The answer region is wired up with
 * `aria-expanded` / `aria-controls` and is keyboard-operable via the native
 * <button> trigger.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">{item.question}</span>
                <span
                  className={cn(
                    'shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-lg leading-none transition-transform',
                    isOpen && 'rotate-45',
                  )}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 sm:px-6"
            >
              <p className="pb-5 text-sm text-slate-600 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
