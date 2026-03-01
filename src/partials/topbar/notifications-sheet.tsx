'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, Settings, Settings2, Shield, Users, Clock, CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNotifications, markAllAsRead, markAsRead, dismissNotification } from '@/actions/notifications.actions';
import { getVapidPublicKey, savePushSubscription } from '@/actions/web-push.actions';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Les imports Item1 à Item20 ont été retirés car ils étaient inutilisés et provoquaient des erreurs de build.

export function NotificationsSheet({ trigger, onAllRead }: { trigger: ReactNode; onAllRead?: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications();
    onAllRead?.();
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    fetchNotifications();
  };

  const getIcon = (type: string, status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="size-4 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="size-4 text-red-500" />;
    if (type === 'ADVANCE') return <div className="text-orange-500 font-bold text-xs">€</div>;
    return <Calendar className="size-4 text-blue-500" />;
  };
  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications();
      // On mark comme tout lu quand on ouvre pour décrémenter le compteur de la cloche
      handleMarkAllAsRead();
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0 flex flex-row items-center justify-between pr-12 pb-2 border-b border-border/50">
          <SheetTitle className="p-3 pb-0">
            Notifications
          </SheetTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] border-orange-200 text-orange-700 hover:bg-orange-100 font-bold px-2 rounded-full mt-3 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-900/30"
            onClick={async () => {
              if (!("Notification" in window) || !("serviceWorker" in navigator)) {
                alert("Ce navigateur ne supporte pas les notifications avancées.");
                return;
              }

              try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                  const registration = await navigator.serviceWorker.ready;
                  let subscription = await registration.pushManager.getSubscription();

                  if (!subscription) {
                    const publicKey = await getVapidPublicKey();
                    if (!publicKey) throw new Error("VAPID public key not configured");
                    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

                    subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: convertedVapidKey
                    });
                  }

                  await savePushSubscription(JSON.parse(JSON.stringify(subscription)));

                  new Notification("VDF Ambulance", {
                    body: "Les notifications sont activées ! 🚀",
                    icon: "/media/app/logo.png"
                  });
                } else if (permission === "denied") {
                  alert("Notifications bloquées. Veuillez les autoriser dans les réglages de votre navigateur.");
                }
              } catch (error) {
                console.error("Failed to subscribe to Web Push:", error);
                alert("Une erreur est survenue lors de l'activation des notifications.");
              }
            }}
          >
            🔔 S'abonner aux alertes
          </Button>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <Tabs defaultValue="all" className="w-full relative">
              <TabsList variant="line" className="w-full px-5 mb-5 mt-2">
                <TabsTrigger value="all">Tout</TabsTrigger>
                <TabsTrigger value="inbox" className="relative">
                  Non lues
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-1 -end-1" />
                </TabsTrigger>
                <div className="grow flex items-center justify-end">
                </div>
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="mt-0">
                <div className="flex flex-col">
                  {loading ? (
                    <div className="p-10 text-center text-muted-foreground text-sm">Chargement...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground text-sm">Aucune notification</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "group p-4 border-b border-border hover:bg-muted/30 transition-colors flex gap-3 items-start relative",
                          !n.read && "bg-blue-50/30 dark:bg-blue-900/10"
                        )}
                      >
                        <div
                          className="flex grow gap-3 cursor-pointer"
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                        >
                          <div className="mt-1 size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {getIcon(n.type, n.status)}
                          </div>
                          <div className="flex flex-col grow">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-bold text-foreground">{n.title}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                            {n.link && (
                              <Link href={n.link} className="text-[10px] uppercase font-bold text-secondary mt-2 hover:underline">
                                Voir la demande
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0">
                          {!n.read && <div className="size-2 rounded-full bg-orange-500 mt-2" />}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 opacity-30 group-hover:opacity-100 touch:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await dismissNotification(n.id);
                              fetchNotifications();
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Inbox Tab (Unread) */}
              <TabsContent value="inbox" className="mt-0">
                <div className="flex flex-col">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground text-sm">Aucune notification non lue</div>
                  ) : (
                    notifications.filter(n => !n.read).map((n) => (
                      <div
                        key={n.id}
                        className="p-4 border-b border-border bg-blue-50/30 flex gap-3 items-start"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        <div className="mt-1 size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {getIcon(n.type, n.status)}
                        </div>
                        <div className="flex flex-col grow">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-foreground">{n.title}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                          {n.link && (
                            <Link href={n.link} className="text-[10px] font-bold text-secondary mt-2 hover:underline">
                              Gérer
                            </Link>
                          )}
                        </div>
                        <div className="size-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-4 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="text-[11px] font-bold">
            Tout marquer comme lu
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
