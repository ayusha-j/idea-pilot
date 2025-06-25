'use client';

import '@/styles/globals.css';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import { ChatProvider } from '@/app/contexts/ChatContext';
//import TestComponent from '@/components/TestComponent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Include confetti library */}
        <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0" strategy="beforeInteractive" />
        
        {/* Include fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ChatProvider>
          
          
          {/* Add some padding to ensure the test panel doesn't overlap content */}
          <div className="pt-[600px]">
            {children}
          </div>
          
          <Toaster position="bottom-right" />
        </ChatProvider>
        
        {/* Additional scripts that need the DOM */}
        <Script id="theme-switcher">
          {`
            // Check for saved theme preference or use default dark theme
            const theme = localStorage.getItem('theme') || 'dark';
            document.documentElement.classList.toggle('dark', theme === 'dark');
          `}
        </Script>
      </body>
    </html>
  );
}