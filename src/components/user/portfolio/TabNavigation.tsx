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
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide py-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`
                relative px-5 py-2.5 mx-1 rounded-md text-sm font-medium transition-all duration-300 
                focus:outline-none whitespace-nowrap
                ${selectedTab === tab.value 
                  ? "text-indigo-700 bg-indigo-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
              onClick={() => onChange(tab.value)}
              aria-selected={selectedTab === tab.value}
              tabIndex={0}
              type="button"
            >
              <span className="relative z-10">{tab.label}</span>
              
              {/* アクティブなタブのインジケーター */}
              {selectedTab === tab.value && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigation;
