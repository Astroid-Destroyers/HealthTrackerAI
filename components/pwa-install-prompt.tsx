// components/pwa-install-prompt.tsx
import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Simple inline SVG icons
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (typeof window !== 'undefined') {
        // Check for iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isIOS && isSafari) {
          // iOS detection - check if running in standalone mode
          setIsInstalled((window.navigator as any).standalone === true);
        } else {
          // Android/Chrome detection - check if installed
          setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
        }
      }
    };

    checkInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a short delay for better UX
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal to avoid showing again for some time
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showPrompt) {
    return null;
  }

  // Check if this is a tablet/mobile device
  const isTabletOrMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 1024 && window.innerHeight <= 1366);
  };

  if (!isTabletOrMobile()) {
    return null; // Only show on tablets/mobile
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="shadow-lg border-2 border-blue-200 bg-white">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DownloadIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Install HealthTrackerAI
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Add to your home screen for the best experience with offline access and push notifications.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  onClick={handleInstallClick}
                  className="flex-1 text-xs"
                >
                  Install App
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onClick={handleDismiss}
                  className="px-2"
                >
                  <CloseIcon />
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}