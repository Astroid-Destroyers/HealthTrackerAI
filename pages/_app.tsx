import type { AppProps } from "next/app";
import { useEffect } from "react";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";

import { fontSans, fontMono } from "@/config/fonts";
import { AuthProvider } from "@/providers/AuthProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { registerServiceWorker } from "@/utils/swRegistration";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Register service worker for push notifications
    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true") {
      registerServiceWorker().catch((error) => {
        console.error("Failed to register service worker:", error);
      });
    }
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <Component {...pageProps} />
          <InstallPrompt />
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
