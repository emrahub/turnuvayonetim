import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { BRAND } from '../lib/brand'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: BRAND.meta.title,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.meta.description,
  keywords: BRAND.meta.keywords.split(', '),
  authors: [{ name: BRAND.meta.author }],
  creator: BRAND.name,
  publisher: BRAND.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND.name,
    startupImage: [
      '/apple-touch-startup-image-750x1334.png',
      '/apple-touch-startup-image-1242x2208.png',
    ],
  },
  applicationName: BRAND.name,
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: BRAND.name,
    title: BRAND.meta.title,
    description: BRAND.meta.description,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: BRAND.meta.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.meta.title,
    description: BRAND.meta.description,
    images: ['/twitter-image.png'],
    creator: BRAND.meta.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon-precomposed.png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content={BRAND.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={BRAND.name} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Preload critical resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);

                      // Check for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              if (confirm('Yeni sürüm mevcut! Güncellemek ister misiniz?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />

        {/* PWA Install Detection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-install-available'));
              });

              window.addEventListener('appinstalled', () => {
                window.dispatchEvent(new CustomEvent('pwa-installed'));
                deferredPrompt = null;
              });

              // Global install function
              window.installPWA = async function() {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  console.log('PWA install outcome:', outcome);
                  deferredPrompt = null;
                  return outcome === 'accepted';
                }
                return false;
              };
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />

        {/* PWA Update Check */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  window.location.reload();
                });

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data.type === 'UPDATE_AVAILABLE') {
                    if (confirm('Yeni sürüm hazır! Sayfayı yeniden yüklemek ister misiniz?')) {
                      window.location.reload();
                    }
                  }
                });
              }

              // Offline status indicator
              window.addEventListener('online', () => {
                document.body.classList.remove('offline');
                console.log('Online');
              });

              window.addEventListener('offline', () => {
                document.body.classList.add('offline');
                console.log('Offline');
              });
            `,
          }}
        />
      </body>
    </html>
  )
}