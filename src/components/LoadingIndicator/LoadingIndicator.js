import React from 'react';
import { motion } from 'framer-motion';
import './LoadingIndicator.css';

const LoadingIndicator = () => {
  return (
    <div className="loading-container">
      <motion.div 
        className="loading-spinner"
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Fetching weather data...
      </motion.p>
    </div>
  );
};

export default LoadingIndicator;
