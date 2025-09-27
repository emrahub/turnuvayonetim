'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'green' | 'white';
  text?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'gold',
  text = 'Yükleniyor...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    gold: 'border-poker-gold',
    green: 'border-poker-green',
    white: 'border-white'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          border-2 border-t-transparent rounded-full
        `}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          className="mt-2 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Turnuva sistemi yükleniyor..." />
        <motion.div
          className="mt-8 text-2xl font-bold text-poker-gold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          TURNUVAYONETIM
        </motion.div>
      </div>
    </div>
  );
}