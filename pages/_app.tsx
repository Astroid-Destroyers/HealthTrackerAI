import type { AppProps } from "next/app";
import { useEffect } from "react";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";

import { fontSans, fontMono } from "@/config/fonts";
import { AuthProvider } from "@/providers/AuthProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Service worker registration temporarily disabled to fix HMR issues
    // TODO: Re-enable for production
    // if (process.env.NODE_ENV === "production") {
    //   registerServiceWorker();
    // }
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
