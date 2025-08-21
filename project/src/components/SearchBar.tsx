import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  onSearch: (query: string, region: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedRegion,
  setSelectedRegion,
  onSearch,
}) => {
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const regions = [
    { name: 'United States', flag: '🇺🇸' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'India', flag: '🇮🇳' },
    { name: 'Singapore', flag: '🇸🇬' },
    { name: 'United Kingdom', flag: '🇬🇧' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery, selectedRegion);
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-white rounded-3xl shadow-2xl p-2 flex items-center gap-2 border border-gray-200">
          {/* Region Selector */}
          <div className="relative">
            <motion.button
              type="button"
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl">
                {regions.find(r => r.name === selectedRegion)?.flag || '🇺🇸'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.button>

            {showRegionDropdown && (
              <motion.div
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-10 min-w-48"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
              >
                {regions.map((region) => (
                  <button
                    key={region.name}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(region.name);
                      setShowRegionDropdown(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xl">{region.flag}</span>
                    <span className="text-gray-700">{region.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter website URL or search term..."
            className="flex-1 px-4 py-3 outline-none text-gray-700 placeholder-gray-400"
          />

          {/* Search Button */}
          <motion.button
            type="submit"
            className="bg-gradient-to-r from-primary to-green-400 text-white px-6 py-3 rounded-2xl font-semibold hover:from-green-500 hover:to-primary transition-all duration-300 shadow-lg"
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
            disabled={!searchQuery.trim()}
          >
            <Search className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default SearchBar;