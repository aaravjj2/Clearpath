/**
 * Accessible tab bar component used on the analyze page.
 */
"use client";

interface Tab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export default function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${active === tab.key
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                active === tab.key ? "bg-slate-600 text-slate-200" : "bg-slate-800 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
