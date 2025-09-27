"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PWAPrompt;
exports.PWAStatusBar = PWAStatusBar;
exports.PWAInstallButton = PWAInstallButton;
const react_1 = require("react");
const usePWA_1 = require("../hooks/usePWA");
function PWAPrompt({ className = '' }) {
    const { canInstall, isInstalled, installApp, hasUpdate, updateApp, isOnline, notificationPermission, requestNotificationPermission, } = (0, usePWA_1.usePWA)();
    const [showInstallPrompt, setShowInstallPrompt] = (0, react_1.useState)(false);
    const [showUpdatePrompt, setShowUpdatePrompt] = (0, react_1.useState)(false);
    const [showOfflinePrompt, setShowOfflinePrompt] = (0, react_1.useState)(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = (0, react_1.useState)(false);
    // Show install prompt when app can be installed
    (0, react_1.useEffect)(() => {
        if (canInstall && !isInstalled) {
            const timer = setTimeout(() => {
                setShowInstallPrompt(true);
            }, 3000); // Show after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [canInstall, isInstalled]);
    // Show update prompt when update is available
    (0, react_1.useEffect)(() => {
        if (hasUpdate) {
            setShowUpdatePrompt(true);
        }
    }, [hasUpdate]);
    // Show offline prompt when going offline
    (0, react_1.useEffect)(() => {
        if (!isOnline) {
            setShowOfflinePrompt(true);
            const timer = setTimeout(() => {
                setShowOfflinePrompt(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);
    // Show notification prompt for push notifications
    (0, react_1.useEffect)(() => {
        if (isInstalled && notificationPermission === 'default') {
            const timer = setTimeout(() => {
                setShowNotificationPrompt(true);
            }, 10000); // Show after 10 seconds
            return () => clearTimeout(timer);
        }
    }, [isInstalled, notificationPermission]);
    const handleInstall = async () => {
        const installed = await installApp();
        if (installed) {
            setShowInstallPrompt(false);
        }
    };
    const handleUpdate = async () => {
        const updated = await updateApp();
        if (updated) {
            setShowUpdatePrompt(false);
        }
    };
    const handleNotificationPermission = async () => {
        await requestNotificationPermission();
        setShowNotificationPrompt(false);
    };
    if (showInstallPrompt && !isInstalled) {
        return (<div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Uygulamayı Yükle</h3>
              <p className="text-sm opacity-90 mt-1">
                Turnuva Yönetim'i telefonunuza yükleyerek daha hızlı erişim sağlayın!
              </p>
              <div className="flex space-x-2 mt-3">
                <button onClick={handleInstall} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
                  Yükle
                </button>
                <button onClick={() => setShowInstallPrompt(false)} className="bg-transparent border border-white text-white px-3 py-1 rounded text-sm hover:bg-white hover:text-blue-600 transition-colors">
                  Daha Sonra
                </button>
              </div>
            </div>
            <button onClick={() => setShowInstallPrompt(false)} className="flex-shrink-0 text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>);
    }
    if (showUpdatePrompt) {
        return (<div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
        <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Güncelleme Mevcut</h3>
              <p className="text-sm opacity-90 mt-1">
                Yeni özellikler ve iyileştirmeler için uygulamayı güncelleyin.
              </p>
              <div className="flex space-x-2 mt-3">
                <button onClick={handleUpdate} className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
                  Güncelle
                </button>
                <button onClick={() => setShowUpdatePrompt(false)} className="bg-transparent border border-white text-white px-3 py-1 rounded text-sm hover:bg-white hover:text-green-600 transition-colors">
                  Daha Sonra
                </button>
              </div>
            </div>
            <button onClick={() => setShowUpdatePrompt(false)} className="flex-shrink-0 text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>);
    }
    if (showOfflinePrompt && !isOnline) {
        return (<div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
        <div className="bg-orange-600 text-white p-3 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Çevrimdışı moddasınız. Bazı özellikler sınırlı olabilir.
              </p>
            </div>
            <button onClick={() => setShowOfflinePrompt(false)} className="flex-shrink-0 text-white hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>);
    }
    if (showNotificationPrompt) {
        return (<div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
        <div className="bg-purple-600 text-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Bildirimler</h3>
              <p className="text-sm opacity-90 mt-1">
                Turnuva güncellemelerini kaçırmamak için bildirimleri açın.
              </p>
              <div className="flex space-x-2 mt-3">
                <button onClick={handleNotificationPermission} className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors">
                  İzin Ver
                </button>
                <button onClick={() => setShowNotificationPrompt(false)} className="bg-transparent border border-white text-white px-3 py-1 rounded text-sm hover:bg-white hover:text-purple-600 transition-colors">
                  Hayır
                </button>
              </div>
            </div>
            <button onClick={() => setShowNotificationPrompt(false)} className="flex-shrink-0 text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>);
    }
    return null;
}
// PWA Status Bar Component
function PWAStatusBar() {
    const { isOnline, isInstalled, serviceWorkerReady } = (0, usePWA_1.usePWA)();
    if (!isInstalled)
        return null;
    return (<div className="fixed top-0 left-0 right-0 z-40">
      <div className={`h-1 transition-all duration-300 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}/>
      {!serviceWorkerReady && (<div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
          <p className="text-yellow-800 text-sm text-center">
            Uygulama yükleniyor...
          </p>
        </div>)}
    </div>);
}
// PWA Install Button Component
function PWAInstallButton({ children, className = '' }) {
    const { canInstall, isInstalled, installApp } = (0, usePWA_1.usePWA)();
    if (isInstalled || !canInstall) {
        return null;
    }
    return (<button onClick={installApp} className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}>
      {children}
    </button>);
}
//# sourceMappingURL=PWAPrompt.jsx.map