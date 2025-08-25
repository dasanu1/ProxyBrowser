import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import BrowserWindow from './components/BrowserWindow';
import Features from './components/Features';
import Blog from './components/Blog';
import Help from './components/Help';
import Footer from './components/Footer';
import Toast from './components/Toast';
import EarthAnimation from './components/EarthAnimation';
import BrowserSelector from './components/BrowserSelector';

function App() {
  const [browserState, setBrowserState] = useState({
    isOpen: false,
    isMinimized: false,
    isFullscreen: false,
    tabs: [],
    activeTabId: null,
  });

  const [toasts, setToasts] = useState([]);
  const [selectedBrowser, setSelectedBrowser] = useState('duckduckgo');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('United States');

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string.startsWith('http') ? string : `https://${string}`);
      return url.hostname.includes('.') && url.hostname.length > 1;
    } catch {
      return false;
    }
  };

  const getSearchUrl = (query, browser) => {
    const searchEngines = {
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`,
      tor: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web` // Use DuckDuckGo for Tor as well
    };
    return searchEngines[browser] || searchEngines.duckduckgo;
  };



  const handleSearch = async (query, region) => {
    if (!query.trim()) return;

    showToast(`Starting proxy search via ${selectedBrowser}...`, 'info');

    // Create new tab
    const tabId = Date.now().toString();
    const newTab = {
      id: tabId,
      title: 'Loading...',
      url: query,
      content: '',
      loading: true,
    };

    setBrowserState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      tabs: [...prev.tabs, newTab],
      activeTabId: tabId,
    }));

    try {
      let finalUrl;

      // Check if it's a valid URL
      if (isValidUrl(query)) {
        finalUrl = query.startsWith('http') ? query : `https://${query}`;
      } else {
        // If not a valid URL, search for it using the selected browser/search engine
        finalUrl = getSearchUrl(query, selectedBrowser);
        showToast(`Searching for: ${query} via ${selectedBrowser.charAt(0).toUpperCase() + selectedBrowser.slice(1)}`, 'info');
      }

      const response = await fetch('http://localhost:3003/api/proxy/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: finalUrl,
          regionHint: region,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setBrowserState(prev => ({
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === tabId
            ? { ...tab, title: data.title || 'Proxied Page', content: data.html, loading: false }
            : tab
        ),
      }));

      showToast('Page loaded successfully', 'success');
    } catch (error) {
      setBrowserState(prev => ({
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === tabId
            ? {
                ...tab,
                title: 'Error',
                content: `<div class="p-8 text-center"><h2 class="text-xl font-bold mb-4">Connection Error</h2><p class="text-gray-600">Unable to load: ${query}</p><p class="text-sm mt-2">Make sure the backend server is running on port 3003</p></div>`,
                loading: false
              }
            : tab
        ),
      }));

      showToast(`Failed to load page: ${error.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-x-hidden">
      <Header />
      
      {browserState.isOpen ? (
        <div className="container mx-auto px-4 py-8">
          <BrowserWindow
            browserState={browserState}
            setBrowserState={setBrowserState}
            onShowToast={showToast}
          />
        </div>
      ) : (
        <main>
          <Hero />
          
          <section className="relative py-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="flex-1 max-w-md">
                  <EarthAnimation />
                </div>
                
                <div className="flex-1 max-w-lg">
                  <div className="flex justify-center mb-6">
                    <BrowserSelector
                      selectedBrowser={selectedBrowser}
                      onBrowserChange={setSelectedBrowser}
                    />
                  </div>

                  <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedRegion={selectedRegion}
                    setSelectedRegion={setSelectedRegion}
                    onSearch={handleSearch}
                  />
                </div>
              </div>
            </div>
          </section>

          <Features />
          <Blog />
          <Help />
          
          <Footer />
        </main>
      )}

      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default App;