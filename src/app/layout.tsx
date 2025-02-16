"use client";

import "./globals.css";
import "./css/cards.css"
import './css/cards/base.css'
import './css/cards/basic.css'
import './css/cards/reverse-holo.css'
import './css/cards/regular-holo.css'
import './css/cards/cosmos-holo.css'
import './css/cards/amazing-rare.css'
import './css/cards/radiant-holo.css'
import './css/cards/v-regular.css'
import './css/cards/v-full-art.css'
import './css/cards/v-max.css'
import './css/cards/v-star.css'
import './css/cards/trainer-full-art.css'
import './css/cards/rainbow-holo.css'
import './css/cards/rainbow-alt.css'
import './css/cards/secret-rare.css'
import './css/cards/trainer-gallery-holo.css'
import './css/cards/trainer-gallery-v-regular.css'
import './css/cards/trainer-gallery-v-max.css'
import './css/cards/trainer-gallery-secret-rare.css'
import './css/cards/shiny-rare.css'
import './css/cards/shiny-v.css'
import './css/cards/shiny-vmax.css'
import './css/cards/swsh.css'
import { Pixelify_Sans, Silkscreen } from 'next/font/google'
import { Providers } from "@/components/providers/Providers";
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import { store } from "@/redux/store";
import { GlobalDataProvider } from "@/components/providers/CardsProvider";
import { Suspense } from "react";
import { SdkProvider } from "@/sdk/SdkContext";
import dynamic from 'next/dynamic';
import { BrowserRouter as Router } from "react-router-dom";
import { GoogleAnalytics } from '@next/third-parties/google'

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixelify-sans',
})

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-silkscreen',
})
// font-[family-name:var(--font-geist-sans)]

// Import AccountsContextProvider dynamically
const DynamicAccountsContextProvider = dynamic(
  () => import('@/accounts/AccountsContext').then(mod => mod.AccountsContextProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pixelifySans.variable} ${silkscreen.variable} antialiased`}
      >
        <Providers>
          <SdkProvider>
            <DynamicAccountsContextProvider>
              <Router>
                <GlobalDataProvider>
                  <Suspense fallback={<div>Loading...</div>}>
                    <main>{children}</main>
                </Suspense>
              </GlobalDataProvider>
            </Router>
            </DynamicAccountsContextProvider>
          </SdkProvider>
        </Providers>
        <GoogleAnalytics gaId="G-M739W3RLHN" />
      </body>
    </html>
  );
}
