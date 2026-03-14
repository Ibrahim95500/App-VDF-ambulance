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

export function Demo1Layout({ children, notificationsCount = 0 }: { children: ReactNode, notificationsCount?: number }) {
  const isMobile = useIsMobile();
  const { settings, setOption } = useSettings();
  const { data: session } = useSession();

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
      {/* Sidebar uniquement sur Desktop */}
      {!isMobile && <Sidebar />}

      <div className="wrapper flex grow flex-col lg:pb-0">
        <Header notificationsCount={notificationsCount} />

        <main
          className="grow pt-5"
          role="content"
          style={{ paddingBottom: isMobile ? '7rem' : undefined }}
        >
          {/* Debug simple pour voir si React revit sur mobile */}
          {isMobile && (
            <div className="flex lg:hidden bg-green-500/10 border-b border-green-500/20 p-2 justify-center">
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Connectivité Mobile OK</span>
            </div>
          )}
          {children}
        </main>

        <Footer />
      </div>

      <BottomTabBar />
    </>
  );
}

export default Demo1Layout;
