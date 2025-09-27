"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePWA = usePWA;
exports.PWAProvider = PWAProvider;
exports.usePWAContext = usePWAContext;
exports.useOfflineStorage = useOfflineStorage;
exports.useBackgroundSync = useBackgroundSync;
const react_1 = require("react");
function usePWA() {
    // Install state
    const [canInstall, setCanInstall] = (0, react_1.useState)(false);
    const [isInstalled, setIsInstalled] = (0, react_1.useState)(false);
    const [deferredPrompt, setDeferredPrompt] = (0, react_1.useState)(null);
    // Update state
    const [hasUpdate, setHasUpdate] = (0, react_1.useState)(false);
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const [waitingWorker, setWaitingWorker] = (0, react_1.useState)(null);
    // Network state
    const [isOnline, setIsOnline] = (0, react_1.useState)(true);
    // Notification state
    const [notificationPermission, setNotificationPermission] = (0, react_1.useState)('default');
    // Service Worker state
    const [serviceWorkerReady, setServiceWorkerReady] = (0, react_1.useState)(false);
    const [serviceWorkerUpdate, setServiceWorkerUpdate] = (0, react_1.useState)(false);
    // PWA state
    const [isStandalone, setIsStandalone] = (0, react_1.useState)(false);
    const [displayMode, setDisplayMode] = (0, react_1.useState)('browser');
    // Check if app is installed
    (0, react_1.useEffect)(() => {
        const checkInstallation = () => {
            // Check if app is in standalone mode
            const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
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
        const handleChange = (e) => {
            setIsStandalone(e.matches);
            setIsInstalled(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    // Network status
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);
    // Service Worker registration and updates
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
        const handleBeforeInstallPrompt = (e) => {
            console.log('PWA: Before install prompt triggered');
            e.preventDefault();
            setDeferredPrompt(e);
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
    const installApp = (0, react_1.useCallback)(async () => {
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
        }
        catch (error) {
            console.error('PWA: Install failed', error);
            return false;
        }
    }, [deferredPrompt]);
    // Update app function
    const updateApp = (0, react_1.useCallback)(async () => {
        if (!waitingWorker) {
            console.warn('PWA: No waiting worker available');
            return false;
        }
        try {
            setIsUpdating(true);
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            setServiceWorkerUpdate(true);
            return true;
        }
        catch (error) {
            console.error('PWA: Update failed', error);
            setIsUpdating(false);
            return false;
        }
    }, [waitingWorker]);
    // Request notification permission
    const requestNotificationPermission = (0, react_1.useCallback)(async () => {
        if (!('Notification' in window)) {
            console.warn('PWA: Notifications not supported');
            return 'denied';
        }
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            console.log('PWA: Notification permission', permission);
            return permission;
        }
        catch (error) {
            console.error('PWA: Failed to request notification permission', error);
            return 'denied';
        }
    }, []);
    // Refresh app
    const refreshApp = (0, react_1.useCallback)(() => {
        window.location.reload();
    }, []);
    // Background sync support
    const isBackgroundSyncSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    // Register background sync
    const registerBackgroundSync = (0, react_1.useCallback)(async (tag) => {
        if (!isBackgroundSyncSupported) {
            console.warn('PWA: Background sync not supported');
            return false;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register(tag);
            console.log('PWA: Background sync registered', tag);
            return true;
        }
        catch (error) {
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
const react_2 = require("react");
const PWAContext = (0, react_2.createContext)(null);
function PWAProvider({ children }) {
    const pwa = usePWA();
    return value = { pwa } >
        { children }
        < /PWAContext.Provider>;
    ;
}
function usePWAContext() {
    const context = (0, react_2.useContext)(PWAContext);
    if (!context) {
        throw new Error('usePWAContext must be used within a PWAProvider');
    }
    return context;
}
// Utility hook for offline storage
function useOfflineStorage(key, defaultValue) {
    const [value, setValue] = (0, react_1.useState)(defaultValue);
    const { isOnline } = usePWA();
    (0, react_1.useEffect)(() => {
        // Load from localStorage on mount
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                setValue(JSON.parse(stored));
            }
        }
        catch (error) {
            console.error('PWA: Failed to load from offline storage', error);
        }
    }, [key]);
    const setStoredValue = (0, react_1.useCallback)((newValue) => {
        setValue(newValue);
        try {
            localStorage.setItem(key, JSON.stringify(newValue));
        }
        catch (error) {
            console.error('PWA: Failed to save to offline storage', error);
        }
    }, [key]);
    return [value, setStoredValue, isOnline];
}
// Utility hook for background sync
function useBackgroundSync() {
    const { registerBackgroundSync, isBackgroundSyncSupported } = usePWA();
    const syncWhenOnline = (0, react_1.useCallback)(async (data, tag = 'background-sync') => {
        if (!isBackgroundSyncSupported) {
            console.warn('PWA: Background sync not supported, storing for manual sync');
            // Store in localStorage for manual sync later
            try {
                const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
                pending.push({ data, tag, timestamp: Date.now() });
                localStorage.setItem('pendingSync', JSON.stringify(pending));
            }
            catch (error) {
                console.error('PWA: Failed to store pending sync data', error);
            }
            return false;
        }
        return await registerBackgroundSync(tag);
    }, [registerBackgroundSync, isBackgroundSyncSupported]);
    return { syncWhenOnline, isBackgroundSyncSupported };
}
exports.default = usePWA;
//# sourceMappingURL=usePWA.js.map