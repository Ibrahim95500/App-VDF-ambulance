'use client';

import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';

export function CapacitorDeepLink() {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const handleUrlOpen = async (data: any) => {
            try {
                if (data.url && data.url.includes('/auth/reset-password')) {
                    console.log('[DEEP LINK] Intercepted reset password URL:', data.url);
                    const urlObj = new URL(data.url);
                    const path = urlObj.pathname + urlObj.search; 
                    // Exemple: /auth/reset-password?token=XYZ
                    
                    if (path) {
                        router.push(path);
                    }
                }
            } catch (error) {
                console.error('[DEEP LINK] Erreur de parsing URL', error);
            }
        };

        const addListenerAsync = async () => {
            await CapacitorApp.addListener('appUrlOpen', handleUrlOpen);
        };

        addListenerAsync();

        return () => {
            CapacitorApp.removeAllListeners();
        };
    }, [router]);

    return null;
}
