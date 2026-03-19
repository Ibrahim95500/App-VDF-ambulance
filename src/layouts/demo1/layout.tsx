'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useSettings } from '@/providers/settings-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';
import { BottomTabBar } from './components/bottom-tab-bar';
import { SessionSync } from '@/components/auth/session-sync';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { useState } from 'react';

export function Demo1Layout({ children, notificationsCount = 0 }: { children: ReactNode, notificationsCount?: number }) {
  const isMobile = useIsMobile();
  const { settings, setOption } = useSettings();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (settings.layouts.demo1.sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [settings]); // Runs only on settings update

  useEffect(() => {
    // Set current layout
    setOption('layout', 'demo1');
  }, [setOption]);
  useEffect(() => {
    // Astuce de pirate (FIABLE): F5 automatique garanti au tout premier atterrissage sur le Dashboard après login.
    // On ne dépend même plus de 'session', on regarde juste si on est côté client et sur le dashboard.
    if (typeof window !== "undefined") {
      const cacheKey = "vdf_pirate_f5_done";
      if (!sessionStorage.getItem(cacheKey)) {
        sessionStorage.setItem(cacheKey, "true");
        console.log("Astuce F5 : Hard Reload à l'atterrissage du Dashboard !");

        // Timeout minimal 100ms
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }, []);


  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('demo1');
    bodyClass.add('sidebar-fixed');
    bodyClass.add('header-fixed');

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []); // Runs only once on mount

  return (
    <>
      <SessionSync />
      {/* Rendu asymétrique uniquement après montage pour éviter Erreur #310 */}
      {isMounted ? (
        <>
          {/* Sidebar uniquement sur Desktop */}
          {!isMobile && (
            <ErrorBoundary fallback={<div className="w-64 bg-muted animate-pulse" />}>
              <Sidebar />
            </ErrorBoundary>
          )}

          <div className="wrapper flex grow flex-col lg:pb-0">
            <ErrorBoundary fallback={<div className="h-16 bg-background border-b animate-pulse" />}>
              <Header notificationsCount={notificationsCount} />
            </ErrorBoundary>

            <main
              className="grow pt-5"
              role="content"
              style={{ paddingBottom: isMobile ? '7rem' : undefined }}
            >
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>

            <Footer />
          </div>

          <ErrorBoundary fallback={null}>
            <BottomTabBar />
          </ErrorBoundary>
        </>
      ) : (
        /* Skeleton minimaliste pour l'hydratation serveur/client identique */
        <div className="flex flex-col h-screen w-screen items-center justify-center bg-background">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10" />
            <div className="h-2 w-32 bg-muted rounded" />
          </div>
        </div>
      )}
    </>
  );
}

export default Demo1Layout;
