import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleSearch = async (query, region) => {
    if (!query.trim()) return;
    
    showToast('Starting proxy search...', 'info');
    
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
      const response = await fetch('http://localhost:3001/api/proxy/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: query.startsWith('http') ? query : `https://${query}`,
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
                content: `<div class="p-8 text-center"><h2 class="text-xl font-bold mb-4">Connection Error</h2><p class="text-gray-600">Unable to load: ${query}</p><p class="text-sm mt-2">Make sure the backend server is running on port 3001</p></div>`, 
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
      </main>

      <Footer />

      <AnimatePresence>
        {browserState.isOpen && (
          <BrowserWindow
            browserState={browserState}
            setBrowserState={setBrowserState}
            onShowToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default App;