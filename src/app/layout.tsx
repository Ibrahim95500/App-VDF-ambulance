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
import { ClientHydration } from '@/components/client-hydration';

const inter = Inter({ subsets: ['latin'] });

import { PWARegistration } from '@/components/pwa-registration';
import { InstallPWAPrompt } from '@/components/install-pwa-prompt';

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
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full text-base text-foreground bg-background',
          inter.className,
        )}
      >
        <AuthProvider>
          <ClientHydration>
            <PWARegistration />
            <InstallPWAPrompt />
            <SettingsProvider>
              <ThemeProvider>
                <I18nProvider>
                  <TooltipsProvider>
                    <ModulesProvider>
                      <Suspense>{children}</Suspense>
                      <Toaster />
                    </ModulesProvider>
                  </TooltipsProvider>
                </I18nProvider>
              </ThemeProvider>
            </SettingsProvider>
          </ClientHydration>
        </AuthProvider>
      </body>
    </html>
  );
}
