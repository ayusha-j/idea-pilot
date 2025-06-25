// src/app/layout.tsx
import '@/styles/globals.css';
import Script from 'next/script';
import { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { ChatProvider } from '@/app/contexts/ChatContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Cabin, Source_Sans_3, JetBrains_Mono } from 'next/font/google';

// Define the fonts
const cabin = Cabin({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cabin',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-source',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Idea Pilot - AI Project Generator',
  description: 'Generate personalized project ideas and get mentorship through a structured roadmap',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${cabin.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Include confetti library */}
        <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-dark-bg text-dark-text">
        <AuthProvider>
          <ChatProvider>
            {children}
            <Toaster position="bottom-right" />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}