import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device and Chrome
    const mobileCheck =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const chromeCheck =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    setIsMobile(mobileCheck);

    // Check if already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isInstalled = localStorage.getItem("pwa-installed") === "true";
    const dismissedCount = parseInt(
      localStorage.getItem("pwa-dismiss-count") || "0",
    );

    if (isStandalone || isInstalled || dismissedCount >= 3) {
      return;
    }

    // Chrome-specific: Wait for user interaction before showing prompt
    let userInteracted = false;

    const handleUserInteraction = () => {
      userInteracted = true;
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    const handleBeforeInstallPrompt = (e: any) => {
      // Only intercept if we're going to show our own prompt UI.
      const hasDismissed =
        localStorage.getItem("pwa-install-dismissed") === "true";

      if (
        !mobileCheck || // don't block native banner on desktop
        hasDismissed || // user previously dismissed
        isStandalone || // already installed
        isInstalled || // flagged as installed
        dismissedCount >= 3 // throttled
      ) {
        // Let the browser show its default banner.
        return;
      }

      // We will show our own UI, so block the default mini-infobar.
      e.preventDefault();
      setDeferredPrompt(e);

      // Chrome: Only show prompt after user interaction
      if (chromeCheck && !userInteracted) {
        // Wait for user interaction, then show prompt
        const showPromptAfterInteraction = () => {
          if (userInteracted) {
            setShowPrompt(true);
            document.removeEventListener("click", showPromptAfterInteraction);
            document.removeEventListener(
              "touchstart",
              showPromptAfterInteraction,
            );
          }
        };

        document.addEventListener("click", showPromptAfterInteraction);
        document.addEventListener("touchstart", showPromptAfterInteraction);
      } else {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Mark as installed and clean up state when the app gets installed
    const handleAppInstalled = () => {
      localStorage.setItem("pwa-installed", "true");
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const currentCount = parseInt(
      localStorage.getItem("pwa-dismiss-count") || "0",
    );

    localStorage.setItem("pwa-dismiss-count", (currentCount + 1).toString());
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Only show on mobile devices and if not dismissed before
  if (
    !isMobile ||
    !showPrompt ||
    localStorage.getItem("pwa-install-dismissed") === "true"
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Card className="bg-primary text-primary-foreground shadow-lg">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Install HealthTrackerAI</h3>
              <p className="text-xs opacity-90 mt-1">
                Add to home screen for better mobile experience with
                notifications
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                className="text-xs"
                size="sm"
                variant="flat"
                onPress={handleInstall}
              >
                Install
              </Button>
              <Button
                isIconOnly
                className="text-primary-foreground/70 hover:text-primary-foreground"
                size="sm"
                variant="ghost"
                onPress={handleDismiss}
              >
                ✕
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
