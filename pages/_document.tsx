import { Html, Head, Main, NextScript } from "next/document";
import clsx from "clsx";

import { fontSans } from "@/config/fonts";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta content="HealthTrackerAI" name="application-name" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content="HealthTracker" name="apple-mobile-web-app-title" />
        <meta
          content="AI-powered health tracking and wellness assistant"
          name="description"
        />
        <meta content="telephone=no" name="format-detection" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="/browserconfig.xml" name="msapplication-config" />
        <meta content="#3b82f6" name="msapplication-TileColor" />
        <meta content="no" name="msapplication-tap-highlight" />
        <meta content="#3b82f6" name="theme-color" />

        {/* PWA Icons */}
        <link href="/icon-192x192.png" rel="apple-touch-icon" />
        <link href="/icon-512x512.png" rel="apple-touch-icon" sizes="512x512" />
        <link
          href="/icon-192x192.png"
          rel="icon"
          sizes="192x192"
          type="image/png"
        />
        <link
          href="/icon-512x512.png"
          rel="icon"
          sizes="512x512"
          type="image/png"
        />

        {/* PWA Manifest */}
        <link href="/manifest.json" rel="manifest" />

        {/* Preload critical resources */}
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
      </Head>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
