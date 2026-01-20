'use client';

import { useState } from 'react';

/**
 * Tabs Component
 * 
 * Design Philosophy:
 * - Clean, minimal tab navigation
 * - Teal accent for active state
 * - No animated underlines or flashy transitions
 */

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div>
      <div className="flex border-b border-neutral-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`
              px-4 py-2.5 text-sm font-medium 
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
              ${activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-500 -mb-px'
                : 'text-neutral-500 hover:text-neutral-700'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div 
        className="py-4"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={activeTab}
      >
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
