"use client";

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800" />
      
      <motion.div 
        className="absolute top-[10%] -left-[5%] w-72 h-72 rounded-full bg-blue-300/10 backdrop-blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute bottom-[10%] -right-[5%] w-96 h-96 rounded-full bg-cyan-300/10 backdrop-blur-3xl"
        animate={{
          x: [0, -70, 0],
          y: [0, 40, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      <motion.div 
        className="absolute top-[40%] right-[20%] w-64 h-64 rounded-full bg-indigo-300/10 backdrop-blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      <motion.div 
        className="absolute top-[70%] left-[30%] w-80 h-80 rounded-full bg-blue-400/5 backdrop-blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 23,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />
    </div>
  );
}
