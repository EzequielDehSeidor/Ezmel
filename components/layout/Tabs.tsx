"use client";

import { useState, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                active === tab.id
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-600 hover:text-brand"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
