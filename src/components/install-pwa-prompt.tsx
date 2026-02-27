"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Smartphone, Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InstallPWAPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Check if app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        if (isStandalone) return

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            // Update UI notify the user they can install the PWA
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Specific check for iOS as it doesn't support beforeinstallprompt
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        if (isIOS && !isStandalone) {
            // Show prompt for iOS after a short delay
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // If no deferredPrompt, it's likely iOS or already installed
            alert("Pour installer l'application sur iOS : \n1. Appuyez sur le bouton 'Partager' en bas de Safari \n2. Faites défiler et appuyez sur 'Sur l'écran d'accueil'")
            return
        }
        // Show the install prompt
        deferredPrompt.prompt()
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt')
        }
        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    if (!showPrompt) return null

    return (
        <div className={cn(
            "fixed bottom-4 left-4 right-4 z-[100] bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 md:max-w-md md:left-auto animate-in slide-in-from-bottom-5 duration-500",
            "flex items-center gap-4"
        )}>
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0">
                <Smartphone className="size-6" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Installer VDF Ambulance</h3>
                <p className="text-xs text-gray-500">Ajoutez l'appli sur votre écran d'accueil pour un accès rapide.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Button size="sm" onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-700 h-8 text-[11px] font-bold px-4">
                    <Download className="size-3 mr-1.5" /> Installer
                </Button>
                <button onClick={() => setShowPrompt(false)} className="text-[10px] text-gray-400 hover:text-gray-600 text-center underline">
                    Plus tard
                </button>
            </div>
        </div>
    )
}
