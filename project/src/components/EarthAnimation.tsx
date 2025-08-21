import React from 'react';
import { motion } from 'framer-motion';

const EarthAnimation: React.FC = () => {
  return (
    <div className="relative w-64 h-64 mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-green-400 to-blue-600 shadow-2xl"
        animate={{ 
          rotate: 360,
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.3)',
            '0 0 40px rgba(59, 130, 246, 0.5)',
            '0 0 20px rgba(59, 130, 246, 0.3)',
          ]
        }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          boxShadow: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }}
      >
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500 via-emerald-400 to-blue-500 opacity-80">
          <div className="absolute top-8 left-12 w-8 h-6 bg-green-600 rounded-full opacity-60" />
          <div className="absolute top-16 right-8 w-6 h-4 bg-green-700 rounded-full opacity-70" />
          <div className="absolute bottom-12 left-8 w-12 h-8 bg-green-600 rounded-full opacity-50" />
          <div className="absolute bottom-8 right-12 w-6 h-6 bg-green-700 rounded-full opacity-60" />
        </div>
      </motion.div>
      
      {/* Orbit rings */}
      <motion.div
        className="absolute inset-0 border-2 border-primary/20 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'scale(1.2)' }}
      />
      <motion.div
        className="absolute inset-0 border border-blue-400/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{ transform: 'scale(1.4)' }}
      />
      
      {/* Floating particles */}
      <motion.div
        className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-8 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full"
        animate={{
          x: [0, 15, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  );
};

export default EarthAnimation;