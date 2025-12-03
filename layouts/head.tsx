import React from "react";
import NextHead from "next/head";

import { siteConfig } from "@/config/site";

export const Head = ({ title, description }: { title?: string; description?: string }) => {
  const metaTitle = title || siteConfig.name;
  const metaDescription = description || siteConfig.description;
  return (
    <NextHead>
      <title>{metaTitle}</title>
      <meta key="title" content={metaTitle} property="og:title" />
      <meta content={metaDescription} property="og:description" />
      <meta content={metaDescription} name="description" />
      <meta
        key="viewport"
        content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        name="viewport"
      />
      <link href="/favicon.ico" rel="icon" />
      <link href="/manifest.json" rel="manifest" />
      <link href="/favicon.ico" rel="apple-touch-icon" />

      {/* PWA and Mobile Meta Tags */}
      <meta content="#3b82f6" name="theme-color" />
      <meta content="yes" name="apple-mobile-web-app-capable" />
      <meta content="default" name="apple-mobile-web-app-status-bar-style" />
      <meta content="HealthTrackerAI" name="apple-mobile-web-app-title" />

      {/* Mobile optimization */}
      <meta content="yes" name="mobile-web-app-capable" />
      <meta content="HealthTrackerAI" name="application-name" />
    </NextHead>
  );
};
