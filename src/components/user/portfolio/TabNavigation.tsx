import React from "react";

type Tab = {
  label: string;
  value: string;
};

type Props = {
  tabs: Tab[];
  selectedTab: string;
  onChange: (tab: string) => void;
};

const TabNavigation: React.FC<Props> = ({ tabs, selectedTab, onChange }) => {
  return (
    <nav className="flex space-x-2 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 max-w-screen-lg mx-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`px-4 py-2 rounded-t text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${selectedTab === tab.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}
          onClick={() => onChange(tab.value)}
          aria-selected={selectedTab === tab.value}
          tabIndex={0}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default TabNavigation;
