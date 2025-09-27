interface UsePWAReturn {
    canInstall: boolean;
    isInstalled: boolean;
    installApp: () => Promise<boolean>;
    hasUpdate: boolean;
    isUpdating: boolean;
    updateApp: () => Promise<boolean>;
    isOnline: boolean;
    isOffline: boolean;
    notificationPermission: NotificationPermission;
    requestNotificationPermission: () => Promise<NotificationPermission>;
    serviceWorkerReady: boolean;
    serviceWorkerUpdate: boolean;
    refreshApp: () => void;
    isStandalone: boolean;
    displayMode: string;
    isBackgroundSyncSupported: boolean;
    registerBackgroundSync: (tag: string) => Promise<boolean>;
}
export declare function usePWA(): UsePWAReturn;
import { ReactNode } from 'react';
export declare function PWAProvider({ children }: {
    children: ReactNode;
}): boolean;
export declare function usePWAContext(): UsePWAReturn;
export declare function useOfflineStorage<T>(key: string, defaultValue: T): readonly [T, (newValue: T) => void, boolean];
export declare function useBackgroundSync(): {
    syncWhenOnline: (data: any, tag?: string) => Promise<boolean>;
    isBackgroundSyncSupported: boolean;
};
export default usePWA;
//# sourceMappingURL=usePWA.d.ts.map