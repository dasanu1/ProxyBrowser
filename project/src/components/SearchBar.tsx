import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Wifi, Globe, Clock, Server } from 'lucide-react';

interface Region {
  name: string;
  flag: string;
  ping: number | null;
}

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
  const [regions, setRegions] = useState<Region[]>([
    { name: 'United States', flag: '🇺🇸', ping: null },
    { name: 'Germany', flag: '🇩🇪', ping: null },
    { name: 'India', flag: '🇮🇳', ping: null },
    { name: 'Singapore', flag: '🇸🇬', ping: null },
    { name: 'United Kingdom', flag: '🇬🇧', ping: null },
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [connectionTime, setConnectionTime] = useState<number>(0);
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);

  // Fetch real-time ping data
  useEffect(() => {
    const fetchPingData = async () => {
      try {
        const response = await fetch('http://localhost:3003/api/locations/status');
        if (response.ok) {
          const data = await response.json();
          setRegions(prevRegions => 
            prevRegions.map(region => {
              const locationData = data.find((loc: { name: string; ping: number }) => loc.name === region.name);
              return {
                ...region,
                ping: locationData ? locationData.ping : null
              };
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch ping data:', error);
      }
    };

    fetchPingData();

    // Refresh ping data every 10 seconds for real-time updates (reduced frequency)
    const interval = setInterval(fetchPingData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle connection timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isConnected && connectionStartTime) {
      interval = setInterval(() => {
        setConnectionTime(Math.floor((Date.now() - connectionStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, connectionStartTime]);

  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'text-gray-400';
    if (ping < 100) return 'text-green-500';
    if (ping < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPingIndicatorColor = (ping: number | null) => {
    if (ping === null) return 'bg-gray-400';
    if (ping < 100) return 'bg-green-500';
    if (ping < 200) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSelectedRegionPing = () => {
    const selected = regions.find(region => region.name === selectedRegion);
    return selected ? selected.ping : null;
  };

  const handleConnect = () => {
    if (selectedRegion) {
      setIsConnected(true);
      setConnectionStartTime(Date.now());
      setShowPreview(true);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionTime(0);
    setConnectionStartTime(null);
    setShowPreview(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && selectedRegion) {
      onSearch(searchQuery, selectedRegion);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedRegionPing = getSelectedRegionPing();

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
                {regions.find((r) => r.name === selectedRegion)?.flag || '🇺🇸'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.button>

            {showRegionDropdown && (
              <motion.div
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-10 min-w-56"
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
                    className="w-full flex items-center justify-between space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{region.flag}</span>
                      <span className="text-gray-700">{region.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-medium ${getPingColor(
                          region.ping
                        )}`}
                      >
                        {region.ping !== null ? `${region.ping}ms` : 'Checking...'}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${getPingIndicatorColor(
                          region.ping
                        )}`}
                      />
                    </div>
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

          {/* Connect/Disconnect Button */}
          <motion.button
            type="button"
            onClick={isConnected ? handleDisconnect : handleConnect}
            className={`px-4 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg flex items-center space-x-2 ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : selectedRegion 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={selectedRegion && !isConnected ? { scale: 1.05 } : {}}
            whileTap={selectedRegion ? { scale: 0.95 } : {}}
            disabled={!selectedRegion && !isConnected}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Connect</span>
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Connection Preview Window */}
      {showPreview && (
        <motion.div
          className="mt-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Photo Placeholder */}
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                <Globe className="w-8 h-8 text-gray-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {regions.find(r => r.name === selectedRegion)?.flag || '🇺🇸'}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRegion}</h3>
                  <div className={`w-3 h-3 rounded-full ${getPingIndicatorColor(selectedRegionPing)}`} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Ping</p>
                      <p className={`text-sm font-medium ${getPingColor(selectedRegionPing)}`}>
                        {selectedRegionPing !== null ? `${selectedRegionPing}ms` : 'Checking...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Connection Time</p>
                      <p className="text-sm font-medium text-gray-900">{formatTime(connectionTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-medium text-green-600">Connected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">{selectedRegion}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchBar;