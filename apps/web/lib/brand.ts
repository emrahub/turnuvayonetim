/**
 * RangeNex Brand Constants
 *
 * Professional, Minimal, Corporate Identity
 * Domain: rangenex.com
 */

export const BRAND = {
  // Brand Identity
  name: 'RangeNex',
  domain: 'rangenex.com',
  tagline: 'Professional Tournament Management',
  description: 'Enterprise-grade poker tournament management platform',

  // Brand Colors (aligned with tailwind.config.ts)
  colors: {
    // Primary Brand Blue
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#3B82F6',    // Main Brand Blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#0F172A',    // Brand Dark
    },

    // Semantic Colors
    success: {
      main: '#10B981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#EF4444',
      light: '#f87171',
      dark: '#dc2626',
    },

    // Neutral Palette (Slate)
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'Poppins, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
  },

  // Spacing (4px base unit)
  spacing: {
    unit: 4,
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.625rem',   // 10px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    brand: '0 0 0 1px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.15)',
  },

  // Logo & Assets
  assets: {
    logo: '/logo.svg',
    logoWhite: '/logo-white.svg',
    icon: '/icon.png',
    favicon: '/favicon.ico',
  },

  // Social & Links
  links: {
    website: 'https://rangenex.com',
    support: 'https://rangenex.com/support',
    documentation: 'https://rangenex.com/docs',
    github: 'https://github.com/rangenex',
  },

  // Meta Information
  meta: {
    title: 'RangeNex - Professional Tournament Management',
    description: 'Enterprise-grade poker tournament management platform with real-time clock, player tracking, and advanced analytics.',
    keywords: 'poker, tournament, management, rangenex, professional, enterprise',
    author: 'RangeNex',
    twitter: '@rangenex',
    ogImage: '/og-image.png',
  },

  // Features
  features: {
    realTimeClock: true,
    playerManagement: true,
    analytics: true,
    icmCalculator: true,
    seatingChart: true,
    swissPairing: true,
    handHistory: true,
    leaderboard: true,
    exportData: true,
    pwaSupport: true,
  },
} as const;

// Type exports for better TypeScript support
export type BrandColors = typeof BRAND.colors;
export type BrandTypography = typeof BRAND.typography;
export type BrandAssets = typeof BRAND.assets;

// Helper functions
export const getBrandColor = (shade: keyof typeof BRAND.colors.brand) => {
  return BRAND.colors.brand[shade];
};

export const getSemanticColor = (type: 'success' | 'warning' | 'error', variant: 'main' | 'light' | 'dark' = 'main') => {
  return BRAND.colors[type][variant];
};

export const getSlateColor = (shade: keyof typeof BRAND.colors.slate) => {
  return BRAND.colors.slate[shade];
};
