import { Link } from "@heroui/link";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";

import { useState } from "react";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head />
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="backdrop-blur-xl bg-white/5 border-t border-white/10">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-lg">HealthTrackerAI</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">Revolutionizing Healthcare with AI</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link
                className="text-gray-400 hover:text-white transition-colors"
                href="/about"
              >
                About
              </Link>
              <Link
                className="text-gray-400 hover:text-white transition-colors"
                href="/contact-us"
              >
                Contact
              </Link>
              <Link
                isExternal
                className="text-gray-400 hover:text-white transition-colors"
                href="https://www.heroui.com"
              >
                HeroUI
              </Link>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 HealthTrackerAI. All rights reserved. Built with ❤️ and cutting-edge AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
