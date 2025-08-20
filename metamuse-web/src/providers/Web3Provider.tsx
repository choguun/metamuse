'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, type Config } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useEffect, useState } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface Web3ProvidersProps {
  children: React.ReactNode;
}

export function Web3Providers({ children }: Web3ProvidersProps) {
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);
    
    // Use requestIdleCallback for faster loading, fallback to immediate timeout
    const loadConfig = () => {
      import('@/config/wagmi').then((module) => {
        setWagmiConfig(module.config);
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(loadConfig);
    } else {
      // Immediate timeout for faster execution
      setTimeout(loadConfig, 0);
    }
  }, []);

  // Show a minimal loading state while preserving as much content as possible
  if (!isClient || !wagmiConfig) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Minimal top loading bar instead of full screen loading */}
        <div className="fixed top-0 left-0 w-full h-1 bg-purple-500/20 z-50">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
        </div>
        {/* Render a fallback layout to prevent complete content loss */}
        <div className="flex flex-col min-h-screen">
          <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-40 h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                MetaMuse
              </div>
            </div>
          </nav>
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8B5CF6',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          appInfo={{
            appName: 'MetaMuse',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}