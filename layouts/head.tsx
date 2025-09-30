import React from "react";
import NextHead from "next/head";

import { siteConfig } from "@/config/site";

interface HeadProps {
  description?: string;
  image?: string;
  title?: string;
  url?: string;
}

export const Head = ({ description, image, title, url }: HeadProps) => {
  const pageTitle = title || siteConfig.name;
  const pageDescription = description || siteConfig.description;
  const pageImage = image || "/api/og";
  const pageUrl = url || "/";

  return (
    <NextHead>
      <title>{pageTitle}</title>
      <meta key="title" content={pageTitle} property="og:title" />
      <meta content={pageDescription} property="og:description" />
      <meta content={pageDescription} name="description" />
      <meta content={pageImage} property="og:image" />
      <meta content={pageUrl} property="og:url" />
      <meta content="website" property="og:type" />
      <meta
        key="viewport"
        content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        name="viewport"
      />
      <link href="/favicon.ico" rel="icon" />
      <link href="/manifest.json" rel="manifest" />
      <link
        href="/apple-touch-icon.png"
        rel="apple-touch-icon"
        sizes="180x180"
      />

      {/* PWA and Mobile Meta Tags */}
      <meta content="#3b82f6" name="theme-color" />
      <meta content="#3b82f6" name="msapplication-TileColor" />
      <meta content="yes" name="apple-mobile-web-app-capable" />
      <meta content="default" name="apple-mobile-web-app-status-bar-style" />
      <meta content="HealthTrackerAI" name="apple-mobile-web-app-title" />

      {/* Mobile optimization */}
      <meta content="yes" name="mobile-web-app-capable" />
      <meta content="HealthTrackerAI" name="application-name" />

      {/* Google AdSense verification */}
      <meta name="google-adsense-account" content="ca-pub-9891270784697044" />
    </NextHead>
  );
};
