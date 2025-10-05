'use client';

import { create } from 'zustand';
import timesyncCreate from 'timesync';

interface ClockState {
  // Server time sync
  serverOffset: number;
  lastSync: Date | null;
  syncAccuracy: number;
  isSyncing: boolean;

  // Clock display
  currentTime: Date;
  serverTime: Date;

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncError: string | null;

  // Actions
  syncWithServer: () => Promise<void>;
  getServerTime: () => Date;
  startAutoSync: () => void;
  stopAutoSync: () => void;
  updateCurrentTime: () => void;
}

let timesyncInstance: any = null;
let autoSyncInterval: NodeJS.Timeout | null = null;

export const useClockStore = create<ClockState>((set, get) => ({
  // Initial state
  serverOffset: 0,
  lastSync: null,
  syncAccuracy: 0,
  isSyncing: false,
  currentTime: new Date(),
  serverTime: new Date(),
  syncStatus: 'idle',
  syncError: null,

  // Sync with server using timesync
  syncWithServer: async () => {
    set({ isSyncing: true, syncStatus: 'syncing', syncError: null });

    try {
      // Initialize timesync if not already created
      if (!timesyncInstance) {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003';
        const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');

        timesyncInstance = timesyncCreate({
          server: httpUrl,
          interval: 60000, // Sync every 60 seconds
        });
      }

      // Perform synchronization
      await new Promise<void>((resolve, reject) => {
        timesyncInstance.on('sync', (offset: number) => {
          const now = new Date();
          const serverTime = new Date(now.getTime() + offset);

          set({
            serverOffset: offset,
            lastSync: now,
            syncAccuracy: Math.abs(offset),
            isSyncing: false,
            syncStatus: 'synced',
            serverTime,
            currentTime: now,
            syncError: null,
          });

          console.log(`Clock synced - Offset: ${offset}ms, Accuracy: ${Math.abs(offset)}ms`);
          resolve();
        });

        timesyncInstance.on('error', (error: any) => {
          set({
            isSyncing: false,
            syncStatus: 'error',
            syncError: error.message || 'Saat senkronizasyonu başarısız',
          });
          console.error('Clock sync error:', error);
          reject(error);
        });

        // Start sync
        timesyncInstance.send();
      });
    } catch (error: any) {
      set({
        isSyncing: false,
        syncStatus: 'error',
        syncError: error.message || 'Saat senkronizasyonu başarısız',
      });
      console.error('Clock sync failed:', error);
      throw error;
    }
  },

  // Get current server time
  getServerTime: () => {
    const { serverOffset } = get();
    return new Date(Date.now() + serverOffset);
  },

  // Start automatic syncing
  startAutoSync: () => {
    // Clear existing interval
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
    }

    // Initial sync
    get().syncWithServer();

    // Sync every 30 seconds
    autoSyncInterval = setInterval(() => {
      get().syncWithServer();
    }, 30000);

    // Update current time every second
    setInterval(() => {
      get().updateCurrentTime();
    }, 1000);
  },

  // Stop automatic syncing
  stopAutoSync: () => {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
    }

    if (timesyncInstance) {
      timesyncInstance.destroy();
      timesyncInstance = null;
    }
  },

  // Update current time
  updateCurrentTime: () => {
    const { serverOffset } = get();
    const now = new Date();
    const serverTime = new Date(now.getTime() + serverOffset);

    set({
      currentTime: now,
      serverTime,
    });
  },
}));

// Auto-start sync when browser is ready
if (typeof window !== 'undefined') {
  // Start syncing after a short delay
  setTimeout(() => {
    useClockStore.getState().startAutoSync();
  }, 1000);
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useClockStore.getState().stopAutoSync();
  });
}
