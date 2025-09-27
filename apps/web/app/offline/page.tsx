'use client';

import React, { useState, useEffect } from 'react';

interface OfflineData {
  tournaments: any[];
  players: any[];
  actions: any[];
  lastSync: string;
}

export default function OfflinePage() {
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error'>('synced');
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  useEffect(() => {
    loadOfflineData();
    checkSyncStatus();
  }, []);

  const loadOfflineData = async () => {
    try {
      const data = localStorage.getItem('tournamentOfflineData');
      if (data) {
        const parsed = JSON.parse(data);
        setOfflineData(parsed);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const pendingActions = localStorage.getItem('pendingTournamentActions');
      if (pendingActions) {
        const actions = JSON.parse(pendingActions);
        setPendingActionsCount(actions.length);
        setSyncStatus(actions.length > 0 ? 'pending' : 'synced');
      }
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  const syncNow = async () => {
    if (!navigator.onLine) {
      alert('No internet connection available');
      return;
    }

    setSyncStatus('syncing');
    try {
      const pendingActions = localStorage.getItem('pendingTournamentActions');
      if (pendingActions) {
        const actions = JSON.parse(pendingActions);

        for (const action of actions) {
          try {
            const response = await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(action),
            });

            if (!response.ok) {
              throw new Error('Sync failed');
            }
          } catch (error) {
            console.error('Failed to sync action:', action, error);
            setSyncStatus('error');
            return;
          }
        }

        localStorage.removeItem('pendingTournamentActions');
        setPendingActionsCount(0);
        setSyncStatus('synced');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const clearOfflineData = () => {
    if (confirm('This will clear all offline data. Continue?')) {
      localStorage.removeItem('tournamentOfflineData');
      localStorage.removeItem('pendingTournamentActions');
      setOfflineData(null);
      setPendingActionsCount(0);
      setSyncStatus('synced');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'syncing': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'synced': return 'All data synchronized';
      case 'pending': return `${pendingActionsCount} actions pending sync`;
      case 'syncing': return 'Synchronizing...';
      case 'error': return 'Sync failed - please try again';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📱 Offline Mode
          </h1>
          <p className="text-gray-300">
            Manage offline data and synchronization
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Connection Status</h3>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${navigator.onLine ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
                </div>
                <div className={`flex items-center space-x-2 ${getSyncStatusColor()}`}>
                  <div className={`w-3 h-3 rounded-full ${getSyncStatusColor().replace('text-', 'bg-')}`}></div>
                  <span>{getSyncStatusText()}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {pendingActionsCount > 0 && navigator.onLine && (
                <button
                  onClick={syncNow}
                  disabled={syncStatus === 'syncing'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
              <button
                onClick={clearOfflineData}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Offline Data Summary */}
        {offlineData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Tournaments</h3>
              <div className="text-3xl font-bold text-green-400">{offlineData.tournaments?.length || 0}</div>
              <div className="text-white/60 text-sm">Stored locally</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Players</h3>
              <div className="text-3xl font-bold text-blue-400">{offlineData.players?.length || 0}</div>
              <div className="text-white/60 text-sm">Cached entries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Pending Actions</h3>
              <div className="text-3xl font-bold text-yellow-400">{pendingActionsCount}</div>
              <div className="text-white/60 text-sm">Awaiting sync</div>
            </div>
          </div>
        )}

        {/* Last Sync Info */}
        {offlineData?.lastSync && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Synchronization Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60">Last Sync</div>
                <div className="text-white font-medium">{formatDate(offlineData.lastSync)}</div>
              </div>
              <div>
                <div className="text-white/60">Data Size</div>
                <div className="text-white font-medium">
                  {Math.round(JSON.stringify(offlineData).length / 1024)} KB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">📖 How Offline Mode Works</h3>
          <div className="space-y-3 text-white/80">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <div className="font-medium">Data Caching</div>
                <div className="text-sm text-white/60">Tournament and player data is automatically cached for offline access</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <div className="font-medium">Offline Actions</div>
                <div className="text-sm text-white/60">Changes made while offline are queued for synchronization</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <div className="font-medium">Auto-Sync</div>
                <div className="text-sm text-white/60">When connection is restored, data is automatically synchronized</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">4</div>
              <div>
                <div className="font-medium">Background Sync</div>
                <div className="text-sm text-white/60">Service worker handles background synchronization when the app is closed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}