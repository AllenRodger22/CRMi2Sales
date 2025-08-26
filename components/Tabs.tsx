import React, { useState, ReactElement, Children, useEffect, ReactNode } from 'react';

interface TabsProps {
  children: ReactNode; // Allow for conditional rendering (booleans, null)
}

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Filter out any falsy children (like from `condition && <Component />`)
  const validChildren = Children.toArray(children).filter(Boolean) as ReactElement[];

  const tabs = validChildren.map((child) => child.props['data-label']);
  
  // This effect resets the active tab if it becomes invalid after a re-render
  // (e.g., when the number of tabs changes due to filtering).
  useEffect(() => {
    if (activeTab >= validChildren.length) {
      setActiveTab(0);
    }
  }, [validChildren.length, activeTab]);


  return (
    <div>
      <div className="border-b border-white/20 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`${
                activeTab === index
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {/* Render only the active tab from the valid children list */}
        {validChildren[activeTab]}
      </div>
    </div>
  );
};

export default Tabs;