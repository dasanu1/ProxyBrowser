import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Plus,
  Minus,
  Square
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  content: string;
  loading: boolean;
}

interface BrowserState {
  isOpen: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  tabs: Tab[];
  activeTabId: string | null;
}

interface BrowserWindowProps {
  browserState: BrowserState;
  setBrowserState: React.Dispatch<React.SetStateAction<BrowserState>>;
  onShowToast: (message: string, type?: string) => void;
}

const BrowserWindow: React.FC<BrowserWindowProps> = ({
  browserState,
  setBrowserState,
  onShowToast,
}) => {
  const [urlInput, setUrlInput] = useState('');

  const activeTab = browserState.tabs.find(tab => tab.id === browserState.activeTabId);

  const handleMinimize = () => {
    setBrowserState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    onShowToast(browserState.isMinimized ? 'Window restored' : 'Window minimized');
  };

  const handleMaximize = () => {
    setBrowserState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    onShowToast(browserState.isFullscreen ? 'Window restored' : 'Window maximized');
  };

  const handleClose = () => {
    setBrowserState(prev => ({ ...prev, isOpen: false, tabs: [], activeTabId: null }));
    onShowToast('Browser window closed');
  };

  const handleNewTab = () => {
    const tabId = Date.now().toString();
    const newTab: Tab = {
      id: tabId,
      title: 'New Tab',
      url: '',
      content: '<div class="p-8 text-center text-gray-500">Enter a URL to browse</div>',
      loading: false,
    };

    setBrowserState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: tabId,
    }));
    onShowToast('New tab added');
  };

  const handleCloseTab = (tabId: string) => {
    setBrowserState(prev => {
      const newTabs = prev.tabs.filter(tab => tab.id !== tabId);
      const newActiveTabId = newTabs.length > 0 
        ? (prev.activeTabId === tabId ? newTabs[0].id : prev.activeTabId)
        : null;
      
      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveTabId,
        isOpen: newTabs.length > 0,
      };
    });
    onShowToast('Tab closed');
  };

  const windowVariants = {
    open: {
      scale: 1,
      opacity: 1,
      y: 0,
    },
    minimized: {
      scale: 0.1,
      opacity: 0.8,
      y: window.innerHeight - 100,
    },
    fullscreen: {
      scale: 1,
      opacity: 1,
      y: 0,
    },
  };

  const getWindowState = () => {
    if (browserState.isMinimized) return 'minimized';
    if (browserState.isFullscreen) return 'fullscreen';
    return 'open';
  };

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        browserState.isMinimized ? 'pointer-events-none' : ''
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {!browserState.isMinimized && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={handleMinimize} />
      )}
      
      <motion.div
        className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden ${
          browserState.isFullscreen 
            ? 'w-full h-full' 
            : browserState.isMinimized
            ? 'w-32 h-20'
            : 'w-full max-w-6xl h-4/5'
        }`}
        variants={windowVariants}
        animate={getWindowState()}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Title Bar */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <motion.button
                onClick={handleClose}
                className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
              <motion.button
                onClick={handleMinimize}
                className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
              <motion.button
                onClick={handleMaximize}
                className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">ProxyBrowser</span>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-200 rounded"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minimize2 className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={handleMaximize}
              className="p-1 hover:bg-gray-200 rounded"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {browserState.isFullscreen ? <Minus /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={handleClose}
              className="p-1 hover:bg-gray-200 rounded text-red-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Tab Bar */}
        {!browserState.isMinimized && (
          <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2 border-b border-gray-200">
            <div className="flex-1 flex space-x-1 overflow-x-auto">
              <AnimatePresence>
                {browserState.tabs.map((tab) => (
                  <motion.div
                    key={tab.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg min-w-32 max-w-48 ${
                      tab.id === browserState.activeTabId 
                        ? 'bg-white shadow-sm border border-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setBrowserState(prev => ({ ...prev, activeTabId: tab.id }))}
                  >
                    <span className="text-sm truncate">{tab.title}</span>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                      whileHover={{ scale: 1.2 }}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <motion.button
              onClick={handleNewTab}
              className="p-2 hover:bg-gray-200 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Navigation Bar */}
        {!browserState.isMinimized && (
          <div className="bg-white px-4 py-3 flex items-center space-x-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCw className="w-4 h-4" />
              </motion.button>
            </div>
            
            <input
              type="text"
              value={urlInput || activeTab?.url || ''}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Content Area */}
        {!browserState.isMinimized && activeTab && (
          <div className="flex-1 bg-white overflow-hidden">
            {activeTab.loading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <iframe
                src={`data:text/html;charset=utf-8,${encodeURIComponent(activeTab.content)}`}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                title={activeTab.title}
              />
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BrowserWindow;