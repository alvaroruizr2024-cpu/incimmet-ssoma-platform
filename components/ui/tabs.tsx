'use client';
import { useId, type ReactNode } from 'react';
export function Tabs({
  tabs,
  value,
  onChange,
  children,
}: {
  tabs: readonly { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  const uid = useId();
  return (
    <div className="min-w-0">
      <div
        role="tablist"
        aria-label="Secciones"
        className="mb-6 flex max-w-full gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map((tab, i) => (
          <button
            type="button"
            role="tab"
            id={`${uid}-${tab.id}`}
            aria-controls={`${uid}-panel`}
            key={tab.id}
            aria-selected={value === tab.id}
            tabIndex={value === tab.id ? 0 : -1}
            className={`min-h-12 shrink-0 rounded-md border px-4 text-sm font-medium ${value === tab.id ? 'border-brand-deep bg-brand-deep text-white' : 'border-border bg-card'}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              const next =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? tabs.length - 1
                    : delta
                      ? (i + delta + tabs.length) % tabs.length
                      : -1;
              if (next < 0) return;
              e.preventDefault();
              const t = tabs[next];
              if (t) {
                onChange(t.id);
                document.getElementById(`${uid}-${t.id}`)?.focus();
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-${value}`}
        tabIndex={0}
        className="min-w-0"
      >
        {children}
      </section>
    </div>
  );
}
