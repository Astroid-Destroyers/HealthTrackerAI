import React, { useEffect } from 'react';
import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import Script from 'next/script';

import DefaultLayout from '@/layouts/default';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// AdSense Ad Component
const AdSenseAd = ({ slot, style }: { slot: string; style?: React.CSSProperties }) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-9891270784697044"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default function AdTestsPage() {
  return (
    <DefaultLayout>
      {/* Google AdSense Script */}
      <Script
        async
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9891270784697044"
        strategy="afterInteractive"
      />

      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-br from-foreground to-foreground-600 bg-clip-text text-transparent">
            AdSense Test Page
          </h1>
          <p className="text-lg text-default-500 mt-4">
            This page is for testing Google AdSense integration
          </p>
        </div>

        <div className="w-full max-w-4xl space-y-8">
          {/* Test Ad Unit 1 - Banner */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Banner Ad Test</h2>
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
              <AdSenseAd 
                slot="1234567890" 
                style={{ minHeight: '90px', width: '100%' }}
              />
            </div>
          </Card>

          {/* Test Ad Unit 2 - Square */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Square Ad Test</h2>
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg flex justify-center">
              <AdSenseAd 
                slot="0987654321" 
                style={{ minHeight: '250px', width: '300px' }}
              />
            </div>
          </Card>

          {/* Test Ad Unit 3 - Responsive */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Responsive Ad Test</h2>
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
              <AdSenseAd 
                slot="1357924680" 
                style={{ minHeight: '200px', width: '100%' }}
              />
            </div>
          </Card>

          {/* AdSense Status Info */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">AdSense Integration Info</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Publisher ID:</strong> ca-pub-9891270784697044</p>
              <p><strong>Script Status:</strong> {typeof window !== 'undefined' && window.adsbygoogle ? '✅ Loaded' : '❌ Not Loaded'}</p>
              <p><strong>Page Status:</strong> Test Environment</p>
            </div>
            
            <div className="mt-4">
              <Button 
                color="primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </Card>

          {/* Debug Information */}
          <Card className="p-6 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-2xl font-semibold mb-4">Debug Information</h2>
            <div className="text-sm space-y-2">
              <p>• AdSense script should load automatically</p>
              <p>• Ads may take time to appear (especially in development)</p>
              <p>• Real ads only show on live domains with approved AdSense accounts</p>
              <p>• In development, you might see blank ad spaces or test ads</p>
            </div>
          </Card>
        </div>
      </section>
    </DefaultLayout>
  );
}