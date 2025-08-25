import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Zap } from 'lucide-react';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? 'bg-white/90 shadow-md' : 'bg-white/80'} backdrop-blur-md border-b border-gray-200 transition-all duration-300`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-400 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Xlora</span>
            <span className="text-xs text-gray-500 ml-1 mt-1">Alpha Platform</span>
          </motion.div>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Home', id: 'hero' },
              { name: 'Features', id: 'features' },
              { name: 'Blog', id: 'blog' },
              { name: 'Help', id: 'help' },
            ].map((item) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Secure</span>
            <Zap className="w-4 h-4 text-yellow-500 ml-2" />
            <span className="text-sm text-gray-600">Fast</span>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;