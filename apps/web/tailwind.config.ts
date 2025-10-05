import type { Config } from 'tailwindcss'

/**
 * RangeNex Brand Design System
 * Professional, Minimal, Corporate
 * rangenex.com
 */

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // RangeNex Professional Color System
      colors: {
        // Brand Primary - Deep Professional Blue
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

        // Success / Active States
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10B981',    // Main Success Green
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },

        // Warning / Attention
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B',    // Main Warning Amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // Error / Danger
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#EF4444',    // Main Error Red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Neutral - Professional Grays (Slate)
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
          900: '#0f172a',     // Background
          950: '#020617',     // Deep Dark
        },
      },

      // Professional Typography
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },

      // Refined Font Sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },

      // Professional Border Radius
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',     // 6px
        DEFAULT: '0.5rem',    // 8px
        'md': '0.625rem',     // 10px
        'lg': '0.75rem',      // 12px
        'xl': '1rem',         // 16px
        '2xl': '1.25rem',     // 20px
        '3xl': '1.5rem',      // 24px
        'full': '9999px',
      },

      // Subtle, Professional Shadows
      boxShadow: {
        // Minimal elevation
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

        // Brand glow (subtle)
        'brand': '0 0 0 1px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.15)',
        'brand-lg': '0 0 0 1px rgba(59, 130, 246, 0.15), 0 8px 24px rgba(59, 130, 246, 0.2)',

        // Inner shadows
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
      },

      // Minimal Background Patterns
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',

        // Subtle brand gradient
        'brand-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',

        // Professional mesh (very subtle)
        'mesh-subtle': `
          radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.03) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.03) 0px, transparent 50%)
        `,
      },

      // Smooth Animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // Standard Transitions
      transitionDuration: {
        'smooth': '200ms',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },

      // Minimal Backdrop Blur
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },

      // Container
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
          '2xl': '3rem',
        },
      },

      // Z-index
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [
    // Minimal custom utilities
    function ({ addUtilities }: any) {
      const newUtilities = {
        // Glassmorphism (subtle)
        '.glass': {
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(12px) saturate(150%)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },

        // Gradient text
        '.gradient-text': {
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        },

        // Custom scrollbar
        '.scrollbar-thin': {
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(148, 163, 184, 0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(148, 163, 184, 0.5)',
            },
          },
        },

        // Hide scrollbar
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },

        // Standardized Icon Sizes
        '.icon-sm': {
          width: '1rem',      // 16px
          height: '1rem',
        },
        '.icon-md': {
          width: '1.25rem',   // 20px
          height: '1.25rem',
        },
        '.icon-lg': {
          width: '1.5rem',    // 24px
          height: '1.5rem',
        },
        '.icon-xl': {
          width: '2rem',      // 32px
          height: '2rem',
        },

        // Smooth Transition
        '.transition-smooth': {
          transition: 'all 200ms ease-in-out',
        },
      }

      addUtilities(newUtilities)
    },
  ],
}

export default config
