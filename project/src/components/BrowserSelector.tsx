import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Globe, Shield } from 'lucide-react';

interface Browser {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface BrowserSelectorProps {
  selectedBrowser: string;
  onBrowserChange: (browser: string) => void;
}

const BrowserSelector: React.FC<BrowserSelectorProps> = ({
  selectedBrowser,
  onBrowserChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const browsers: Browser[] = [
    { 
      id: 'duckduckgo', 
      name: 'DuckDuckGo', 
      icon: <Search className="w-5 h-5 text-orange-500" />,
      description: 'Privacy-focused search'
    },
    { 
      id: 'google', 
      name: 'Google', 
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      description: 'Standard web search'
    },
    { 
      id: 'tor', 
      name: 'Tor Browser', 
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      description: 'Anonymous browsing'
    },
  ];

  const selectedBrowserData = browsers.find(browser => browser.id === selectedBrowser) || browsers[0];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {selectedBrowserData.icon}
        <span className="text-gray-700 font-medium">{selectedBrowserData.name}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-20 min-w-56"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {browsers.map((browser) => (
              <motion.button
                key={browser.id}
                onClick={() => {
                  onBrowserChange(browser.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                whileHover={{ backgroundColor: '#f9fafb' }}
              >
                {browser.icon}
                <div>
                  <div className="font-medium text-gray-900">{browser.name}</div>
                  <div className="text-sm text-gray-500">{browser.description}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowserSelector;