"use client"

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { saveFcmToken } from '@/actions/web-push.actions';
import { useSession } from 'next-auth/react';

export function PushNotificationsManager() {
    const { data: session } = useSession();

    useEffect(() => {
        // Only run on native platforms (iOS/Android)
        if (!Capacitor.isNativePlatform()) return;

        // Only run if user is logged in
        if (!session?.user?.id) return;

        const setupPush = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('User denied push permissions');
                    return;
                }

                // Register with Apple/Google to get the token
                await PushNotifications.register();

                // On success, we should be able to receive notifications
                await PushNotifications.addListener('registration', async (token) => {
                    console.log('Push registration success, token: ' + token.value);
                    await saveFcmToken(token.value);
                });

                // Some error occurred
                await PushNotifications.addListener('registrationError', (error) => {
                    console.error('Error on registration: ' + JSON.stringify(error));
                });

                // Show us the notification payload if the app is open on our device
                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ' + JSON.stringify(notification));
                    // You could show a local toast here if you want
                });

                // Method called when tapping on a notification
                await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed: ' + JSON.stringify(notification));
                    const url = notification.notification.data?.url;
                    if (url) {
                        window.location.href = url;
                    }
                });
            } catch (err) {
                console.error('Push setup failed', err);
            }
        };

        setupPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [session]);

    return null;
}
