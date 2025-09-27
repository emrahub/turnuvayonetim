'use client';

import { useState, useEffect, useCallback } from 'react';

// PWA Install Prompt Interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Background Sync API Interface
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Extend ServiceWorkerRegistration to include sync property
declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }
}

// PWA Update Event Interface
interface UpdateAvailableEvent extends Event {
  readonly isUpdateAvailable: boolean;
  readonly isFirstLaunch: boolean;
}

// PWA Hook Return Type
interface UsePWAReturn {
  // Install functionality
  canInstall: boolean;
  isInstalled: boolean;
  installApp: () => Promise<boolean>;

  // Update functionality
  hasUpdate: boolean;
  isUpdating: boolean;
  updateApp: () => Promise<boolean>;

  // Offline functionality
  isOnline: boolean;
  isOffline: boolean;

  // Notification functionality
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;

  // Service Worker functionality
  serviceWorkerReady: boolean;
  serviceWorkerUpdate: boolean;
  refreshApp: () => void;

  // PWA Features
  isStandalone: boolean;
  displayMode: string;

  // Background sync
  isBackgroundSyncSupported: boolean;
  registerBackgroundSync: (tag: string) => Promise<boolean>;
}

export function usePWA(): UsePWAReturn {
  // Install state
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Update state
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Network state
  const [isOnline, setIsOnline] = useState(true);

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Service Worker state
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [serviceWorkerUpdate, setServiceWorkerUpdate] = useState(false);

  // PWA state
  const [isStandalone, setIsStandalone] = useState(false);
  const [displayMode, setDisplayMode] = useState('browser');

  // Check if app is installed
  useEffect(() => {
    const checkInstallation = () => {
      // Check if app is in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

      setIsStandalone(standalone);
      setIsInstalled(standalone);

      // Get display mode
      const mediaQueries = [
        'fullscreen',
        'standalone',
        'minimal-ui',
        'browser'
      ];

      for (const mode of mediaQueries) {
        if (window.matchMedia(`(display-mode: ${mode})`).matches) {
          setDisplayMode(mode);
          break;
        }
      }
    };

    checkInstallation();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Network status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Service Worker registration and updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA: Service Worker registered', registration);
          setServiceWorkerReady(true);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('PWA: Update found');
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: Update available');
                  setHasUpdate(true);
                  setWaitingWorker(newWorker);
                }
              });
            }
          });

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('PWA: Controller changed - reloading page');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('PWA: Service Worker registration failed', error);
        });
    }
  }, []);

  // Before install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: Before install prompt triggered');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App installed');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install app function
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('PWA: No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      console.log('PWA: Install choice', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('PWA: Install failed', error);
      return false;
    }
  }, [deferredPrompt]);

  // Update app function
  const updateApp = useCallback(async (): Promise<boolean> => {
    if (!waitingWorker) {
      console.warn('PWA: No waiting worker available');
      return false;
    }

    try {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setServiceWorkerUpdate(true);
      return true;
    } catch (error) {
      console.error('PWA: Update failed', error);
      setIsUpdating(false);
      return false;
    }
  }, [waitingWorker]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('PWA: Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log('PWA: Notification permission', permission);
      return permission;
    } catch (error) {
      console.error('PWA: Failed to request notification permission', error);
      return 'denied';
    }
  }, []);

  // Refresh app
  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

  // Background sync support
  const isBackgroundSyncSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;

  // Register background sync
  const registerBackgroundSync = useCallback(async (tag: string): Promise<boolean> => {
    if (!isBackgroundSyncSupported) {
      console.warn('PWA: Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('PWA: Background sync registered', tag);
      return true;
    } catch (error) {
      console.error('PWA: Background sync registration failed', error);
      return false;
    }
  }, [isBackgroundSyncSupported]);

  return {
    // Install functionality
    canInstall,
    isInstalled,
    installApp,

    // Update functionality
    hasUpdate,
    isUpdating,
    updateApp,

    // Offline functionality
    isOnline,
    isOffline: !isOnline,

    // Notification functionality
    notificationPermission,
    requestNotificationPermission,

    // Service Worker functionality
    serviceWorkerReady,
    serviceWorkerUpdate,
    refreshApp,

    // PWA Features
    isStandalone,
    displayMode,

    // Background sync
    isBackgroundSyncSupported,
    registerBackgroundSync,
  };
}

// PWA Context for React components
import { createContext, useContext, ReactNode } from 'react';

const PWAContext = createContext<UsePWAReturn | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const pwa = usePWA();

  return (
    <PWAContext.Provider value={pwa}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAContext(): UsePWAReturn {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}

// Utility hook for offline storage
export function useOfflineStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const { isOnline } = usePWA();

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('PWA: Failed to load from offline storage', error);
    }
  }, [key]);

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('PWA: Failed to save to offline storage', error);
    }
  }, [key]);

  return [value, setStoredValue, isOnline] as const;
}

// Utility hook for background sync
export function useBackgroundSync() {
  const { registerBackgroundSync, isBackgroundSyncSupported } = usePWA();

  const syncWhenOnline = useCallback(async (data: any, tag: string = 'background-sync') => {
    if (!isBackgroundSyncSupported) {
      console.warn('PWA: Background sync not supported, storing for manual sync');
      // Store in localStorage for manual sync later
      try {
        const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
        pending.push({ data, tag, timestamp: Date.now() });
        localStorage.setItem('pendingSync', JSON.stringify(pending));
      } catch (error) {
        console.error('PWA: Failed to store pending sync data', error);
      }
      return false;
    }

    return await registerBackgroundSync(tag);
  }, [registerBackgroundSync, isBackgroundSyncSupported]);

  return { syncWhenOnline, isBackgroundSyncSupported };
}

export default usePWA;