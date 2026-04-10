import { ReactNode, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/providers/settings-provider';
import { TooltipsProvider } from '@/providers/tooltips-provider';
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';
import { I18nProvider } from '@/providers/i18n-provider';
import { ModulesProvider } from '@/providers/modules-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ErrorBoundary } from '@/components/common/error-boundary';


const inter = Inter({ subsets: ['latin'] });

import { PWARegistration } from '@/components/pwa-registration';
import { InstallPWAPrompt } from '@/components/install-pwa-prompt';
import { PushNotificationsManager } from '@/components/push-notifications-manager';

import '@/css/styles.css';
import '@/components/keenicons/assets/styles.css';

export const metadata: Metadata = {
  title: {
    template: '%s | VDF Ambulance',
    default: 'VDF Ambulance',
  },
  description: 'Application de gestion interne VDF Ambulance',
  manifest: '/manifest.json',
  icons: {
    icon: '/media/app/logo.png',
    apple: '/media/app/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VDF Ambulance',
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { CapacitorDeepLink } from '@/components/capacitor-deep-link';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          'antialiased flex h-full text-base text-foreground bg-background',
          inter.className,
        )}
      >
        <ErrorBoundary fallback={<div className="flex h-screen w-screen items-center justify-center p-10 text-center"><h1>Une erreur critique est survenue. Veuillez rafraîchir la page.</h1></div>}>
          <AuthProvider>
            <PWARegistration />
            <InstallPWAPrompt />
            <CapacitorDeepLink />
            <ModulesProvider>
              <SettingsProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                  <I18nProvider>
                    <PushNotificationsManager />
                    <TooltipsProvider>
                      <Suspense>
                        {children}
                      </Suspense>
                      <Toaster />
                    </TooltipsProvider>
                  </I18nProvider>
                </ThemeProvider>
              </SettingsProvider>
            </ModulesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
