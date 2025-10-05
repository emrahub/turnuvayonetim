/**
 * Mobile-First Responsive Utilities
 * Breakpoints: mobile (default), tablet (768px), desktop (1024px), wide (1280px)
 */

export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Check if current viewport matches breakpoint
 */
export const useBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'mobile';

  const width = window.innerWidth;

  if (width >= 1280) return 'wide';
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
};

/**
 * Responsive class utilities
 */
export const responsive = {
  // Container widths
  container: 'w-full px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl',

  // Grid layouts
  grid: {
    // Mobile-first grid
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },

  // Gap utilities
  gap: {
    sm: 'gap-2 md:gap-3',
    md: 'gap-3 md:gap-4',
    lg: 'gap-4 md:gap-6',
    xl: 'gap-6 md:gap-8',
  },

  // Padding utilities (mobile-first)
  padding: {
    sm: 'p-2 md:p-3',
    md: 'p-3 md:p-4',
    lg: 'p-4 md:p-6',
    xl: 'p-6 md:p-8',
  },

  // Text sizes (mobile-first)
  text: {
    xs: 'text-xs md:text-sm',
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl',
    '2xl': 'text-2xl md:text-3xl',
    '3xl': 'text-3xl md:text-4xl',
  },

  // Touch-friendly sizes
  touch: {
    // Minimum 44x44px touch targets (iOS guidelines)
    button: 'min-h-[44px] min-w-[44px] touch-manipulation',
    input: 'min-h-[44px] touch-manipulation',
    // Larger for better mobile UX
    buttonLg: 'min-h-[52px] min-w-[52px] touch-manipulation',
  },

  // Mobile-optimized cards
  card: {
    base: 'rounded-lg border border-gray-200 bg-white shadow-sm',
    mobile: 'rounded-lg p-3 md:p-4',
    tablet: 'rounded-lg p-4 md:p-6',
  },

  // Stack layouts (vertical on mobile, horizontal on desktop)
  stack: {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-col md:flex-row',
    reverse: 'flex flex-col-reverse md:flex-row',
  },

  // Hide/show utilities
  hide: {
    mobile: 'hidden md:block',
    tablet: 'hidden lg:block',
    desktop: 'md:hidden',
  },
} as const;

/**
 * Touch-optimized interaction utilities
 */
export const touchOptimized = {
  // Prevent iOS double-tap zoom
  noZoom: 'touch-manipulation select-none',

  // Better scrolling on mobile
  scroll: 'overflow-auto -webkit-overflow-scrolling-touch',

  // Smooth momentum scrolling
  momentum: 'overflow-y-auto overscroll-contain',

  // Tap highlight removal (for custom buttons)
  noHighlight: '-webkit-tap-highlight-color-transparent',
} as const;

/**
 * Tournament Clock specific responsive utilities
 */
export const clockResponsive = {
  // Timer display
  timer: {
    container: 'w-full max-w-md mx-auto md:max-w-lg lg:max-w-xl',
    display: 'text-5xl md:text-6xl lg:text-7xl font-bold tabular-nums',
    label: 'text-sm md:text-base lg:text-lg',
  },

  // Blind levels
  blinds: {
    container: 'grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4',
    value: 'text-xl md:text-2xl lg:text-3xl font-semibold',
    label: 'text-xs md:text-sm',
  },

  // Control buttons
  controls: {
    container: 'flex flex-col sm:flex-row gap-2 md:gap-3',
    button: 'min-h-[48px] px-4 py-2 text-sm md:text-base font-medium rounded-lg touch-manipulation',
  },
} as const;

/**
 * Player list responsive utilities
 */
export const playerResponsive = {
  // Player card
  card: {
    container: 'flex items-center justify-between p-3 md:p-4 rounded-lg border touch-manipulation',
    avatar: 'w-10 h-10 md:w-12 md:h-12 rounded-full',
    name: 'text-sm md:text-base font-medium',
    chips: 'text-base md:text-lg font-semibold tabular-nums',
  },

  // Player list
  list: {
    container: 'space-y-2 md:space-y-3',
    grid: 'grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3',
  },
} as const;

/**
 * Table/Seating responsive utilities
 */
export const seatingResponsive = {
  // Table layout
  table: {
    container: 'relative aspect-[4/3] md:aspect-[16/9] w-full max-w-4xl mx-auto',
    surface: 'absolute inset-0 rounded-full md:rounded-[50%]',
  },

  // Seat position
  seat: {
    base: 'absolute transform -translate-x-1/2 -translate-y-1/2',
    size: 'w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16',
    avatar: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
  },
} as const;

/**
 * Modal/Dialog responsive utilities
 */
export const modalResponsive = {
  overlay: 'fixed inset-0 bg-black/50 z-40',
  container: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
  content: 'w-full sm:max-w-lg sm:rounded-lg bg-white shadow-xl',

  // Mobile-optimized (slide up from bottom on mobile)
  mobile: {
    container: 'fixed inset-x-0 bottom-0 sm:relative sm:inset-auto',
    content: 'rounded-t-2xl sm:rounded-lg max-h-[90vh] overflow-y-auto',
  },
} as const;

/**
 * Navigation responsive utilities
 */
export const navResponsive = {
  // Bottom nav for mobile, side nav for desktop
  mobile: {
    container: 'fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 md:hidden',
    item: 'flex-1 flex flex-col items-center justify-center py-2 min-h-[60px]',
  },

  desktop: {
    container: 'hidden md:flex md:flex-col md:w-64 md:border-r md:border-gray-200',
    item: 'flex items-center px-4 py-3 text-sm font-medium',
  },
} as const;

/**
 * Form responsive utilities
 */
export const formResponsive = {
  field: {
    container: 'space-y-1 md:space-y-2',
    label: 'block text-sm md:text-base font-medium',
    input: 'w-full min-h-[44px] px-3 py-2 text-base md:text-sm rounded-lg border',
    error: 'text-xs md:text-sm text-red-600',
  },

  group: {
    vertical: 'space-y-3 md:space-y-4',
    horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4',
  },
} as const;
