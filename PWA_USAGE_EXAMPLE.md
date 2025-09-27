# PWA Implementation - Usage Example

Bu dosya, Next.js 14 ile implement edilen PWA özelliklerinin nasıl kullanılacağını gösterir.

## 📁 Dosya Yapısı

```
apps/web/
├── public/
│   ├── sw.js                    # Service Worker
│   ├── manifest.json            # Web App Manifest
│   └── offline.html             # Offline fallback sayfası
├── hooks/
│   └── usePWA.ts               # PWA Hook
├── components/
│   └── PWAPrompt.tsx           # PWA UI Bileşenleri
├── app/
│   ├── layout.tsx              # PWA meta tagları ve konfigürasyon
│   └── globals.css             # PWA stilleri
└── next.config.js              # Next.js PWA konfigürasyonu
```

## 🚀 Temel Kullanım

### 1. PWA Hook Kullanımı

```tsx
'use client';
import { usePWA } from '../hooks/usePWA';

export default function MyComponent() {
  const {
    canInstall,
    isInstalled,
    installApp,
    hasUpdate,
    updateApp,
    isOnline,
    notificationPermission,
    requestNotificationPermission
  } = usePWA();

  return (
    <div>
      {/* Install Button */}
      {canInstall && !isInstalled && (
        <button onClick={installApp} className="pwa-install-btn">
          Uygulamayı Yükle
        </button>
      )}

      {/* Update Button */}
      {hasUpdate && (
        <button onClick={updateApp} className="pwa-btn-primary">
          Güncelleme Mevcut
        </button>
      )}

      {/* Online/Offline Status */}
      <div className={`status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
      </div>

      {/* Notification Permission */}
      {notificationPermission === 'default' && (
        <button onClick={requestNotificationPermission}>
          Bildirimleri Aç
        </button>
      )}
    </div>
  );
}
```

### 2. PWA Provider Kullanımı

```tsx
// app/layout.tsx
import { PWAProvider } from '../hooks/usePWA';
import PWAPrompt from '../components/PWAPrompt';

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <PWAProvider>
          {children}
          <PWAPrompt />
        </PWAProvider>
      </body>
    </html>
  );
}
```

### 3. Offline Storage Kullanımı

```tsx
'use client';
import { useOfflineStorage } from '../hooks/usePWA';

export default function OfflineComponent() {
  const [userData, setUserData, isOnline] = useOfflineStorage('user-data', {
    name: '',
    preferences: {}
  });

  const saveData = (newData) => {
    setUserData(newData);
    // Veri otomatik olarak localStorage'a kaydedilir
  };

  return (
    <div>
      <p>Çevrimiçi Durum: {isOnline ? 'Bağlı' : 'Çevrimdışı'}</p>
      <input
        value={userData.name}
        onChange={(e) => saveData({ ...userData, name: e.target.value })}
        placeholder="İsim"
      />
    </div>
  );
}
```

### 4. Background Sync Kullanımı

```tsx
'use client';
import { useBackgroundSync } from '../hooks/usePWA';

export default function SyncComponent() {
  const { syncWhenOnline, isBackgroundSyncSupported } = useBackgroundSync();

  const handleFormSubmit = async (formData) => {
    try {
      // Önce normal POST isteği dene
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Network failed');
    } catch (error) {
      // Başarısız olursa background sync'e ekle
      await syncWhenOnline(formData, 'tournament-submission');
      console.log('Çevrimiçi olduğunuzda gönderilecek');
    }
  };

  return (
    <div>
      <p>Background Sync: {isBackgroundSyncSupported ? 'Destekleniyor' : 'Desteklenmiyor'}</p>
      <form onSubmit={handleFormSubmit}>
        {/* Form content */}
      </form>
    </div>
  );
}
```

## 🎨 PWA CSS Sınıfları

### Hazır Bileşenler

```tsx
// Install Button
<button className="pwa-install-btn">Yükle</button>

// PWA Card
<div className="pwa-card">
  <h3>Kart Başlığı</h3>
  <p>Kart içeriği</p>
</div>

// Primary Button
<button className="pwa-btn-primary">Ana Buton</button>

// Secondary Button
<button className="pwa-btn-secondary">İkincil Buton</button>
```

### Güvenlik Alanı Utilities

```tsx
// Safe area padding'leri
<div className="pwa-safe-top">Üst güvenlik alanı</div>
<div className="pwa-safe-bottom">Alt güvenlik alanı</div>
<div className="pwa-safe-left">Sol güvenlik alanı</div>
<div className="pwa-safe-right">Sağ güvenlik alanı</div>
```

### Touch Optimizasyonu

```tsx
// Touch manipulation
<div className="touch-manipulation">
  Touch-friendly alan
</div>
```

### Animasyonlar

```tsx
// Fade in animasyonu
<div className="pwa-fade-in">Fade in</div>

// Slide up animasyonu
<div className="pwa-slide-up">Slide up</div>
```

## 📱 Service Worker Özellikleri

### Cache Stratejileri

1. **Network First**: HTML sayfalar ve API çağrıları
   - Önce network dene, başarısız olursa cache'den al

2. **Cache First**: Resimler ve statik dosyalar
   - Önce cache'den al, yoksa network'ten çek

3. **Stale While Revalidate**: JavaScript ve CSS
   - Cache'den hemen dön, arka planda güncelle

### Background Sync

```javascript
// Service Worker'da otomatik sync
if (event.tag === 'background-sync') {
  event.waitUntil(handleBackgroundSync());
}
```

### Push Notifications

```javascript
// Notification gösterme
self.registration.showNotification('Turnuva Yönetim', {
  body: 'Yeni turnuva bildirimi!',
  icon: '/icon-192x192.png',
  actions: [
    { action: 'explore', title: 'Görüntüle' },
    { action: 'close', title: 'Kapat' }
  ]
});
```

## 🔧 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_SW_URL=/sw.js
NEXT_PUBLIC_MANIFEST_URL=/manifest.json
NEXT_PUBLIC_APP_NAME="Turnuva Yönetim"
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📦 Gerekli Icon'lar

PWA için aşağıdaki icon'ları eklemeniz gerekir:

```
public/
├── favicon.ico
├── icon-16x16.png
├── icon-32x32.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── apple-touch-icon.png
└── apple-touch-icon-180x180.png
```

## 🚀 Deployment

### 1. Build

```bash
npm run build
```

### 2. PWA Test

- Chrome DevTools > Application > Service Workers
- Chrome DevTools > Application > Manifest
- Lighthouse PWA audit

### 3. Install Test

- Chrome address bar'da install icon'u görünmeli
- "Add to Home Screen" özelliği çalışmalı

## 📊 PWA Metrikleri

### Lighthouse Kriterleri

- **Progressive Web App**: 100/100
- **Performance**: 90+/100
- **Accessibility**: 95+/100
- **Best Practices**: 95+/100
- **SEO**: 95+/100

### PWA Kriterleri

✅ Web App Manifest
✅ Service Worker
✅ HTTPS
✅ Responsive Design
✅ Fast Load Times
✅ Offline Functionality
✅ Install Prompt

## 🔍 Debug ve Test

### Service Worker Debug

```javascript
// Chrome DevTools Console'da
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered SWs:', registrations);
});
```

### Cache Kontrol

```javascript
// Cache içeriğini kontrol et
caches.keys().then(cacheNames => {
  console.log('Available caches:', cacheNames);
});
```

### PWA Install Test

```javascript
// Global install function (layout.tsx'da tanımlı)
window.installPWA().then(result => {
  console.log('Install result:', result);
});
```

Bu implementation, modern PWA standartlarına uygun, tam özellikli bir çözüm sağlar ve Next.js 14 ile mükemmel uyum içinde çalışır.