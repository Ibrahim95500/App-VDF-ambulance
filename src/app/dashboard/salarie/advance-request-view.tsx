"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { ShieldAlert, Info, EuroIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { RequestAdvanceForm } from "./request-form"
import { AdvanceHistoryTable } from "./history-table"

interface BannerMessage {
    icon: ReactNode
    text: string
    style: string
    onClose?: () => void
}

function BannerTicker({ messages }: { messages: BannerMessage[] }) {
    const [current, setCurrent] = useState(0)
    const [fading, setFading] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const goTo = (index: number) => {
        setFading(true)
        setTimeout(() => {
            setCurrent(index)
            setFading(false)
        }, 300)
    }

    useEffect(() => {
        if (messages.length <= 1) return
        timerRef.current = setInterval(() => {
            setFading(true)
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % messages.length)
                setFading(false)
            }, 300)
        }, 4000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [messages.length])

    if (messages.length === 0) return null
    const msg = messages[current]

    return (
        <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${fading ? 'opacity-0' : 'opacity-100'} ${msg.style}`}>
            <span className="shrink-0">{msg.icon}</span>
            <p className="flex-1">{msg.text}</p>
            <div className="flex items-center gap-1 shrink-0 ml-2">
                {messages.length > 1 && (
                    <>
                        <button onClick={() => goTo((current - 1 + messages.length) % messages.length)} className="opacity-70 hover:opacity-100 transition-opacity">
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-[10px] opacity-70 font-bold tabular-nums">{current + 1}/{messages.length}</span>
                        <button onClick={() => goTo((current + 1) % messages.length)} className="opacity-70 hover:opacity-100 transition-opacity">
                            <ChevronRight className="size-4" />
                        </button>
                    </>
                )}
                {msg.onClose && (
                    <button onClick={msg.onClose} className="opacity-70 hover:opacity-100 ml-1 transition-opacity">✕</button>
                )}
            </div>
        </div>
    )
}

interface AdvanceRequestViewProps {
    myRequests: any[]
}

export function AdvanceRequestView({ myRequests }: AdvanceRequestViewProps) {
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    // Target Month logic
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // Safety for hydration mismatch on dates and times between Server and Safari iOS
    const [targetMonthName, setTargetMonthName] = useState<string>("")
    const [isLocked, setIsLocked] = useState<boolean>(false)

    useEffect(() => {
        setTargetMonthName(targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
        setIsLocked(today.getDate() > 15)
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </div>
    }

    return (
        <div className="flex flex-col gap-5 lg:gap-7.5 max-w-5xl mx-auto w-full px-2 sm:px-4">
            <div className="flex items-center gap-3 mb-2">
                <EuroIcon className="size-8 text-secondary" />
                <h1 className="text-3xl font-bold tracking-tight text-secondary">
                    Mes Acomptes
                </h1>
            </div>

            {/* Bannière défilante des informations importantes */}
            {(() => {
                const messages = [
                    ...(submissionError ? [{
                        icon: <ShieldAlert className="size-4 shrink-0" />,
                        text: submissionError,
                        style: "bg-red-600 text-white border-red-700",
                        onClose: () => setSubmissionError(null)
                    }] : []),
                    ...(isLocked ? [{
                        icon: <ShieldAlert className="size-4 shrink-0" />,
                        text: "⚠️ Les demandes d'acompte sont fermées pour ce mois-ci. (Uniquement du 1er au 15)",
                        style: "bg-red-500 text-white border-red-600",
                    }] : []),
                    {
                        icon: <Info className="size-4 shrink-0" />,
                        text: `Votre demande sera déduite du salaire de : ${targetMonthName}.`,
                        style: "bg-orange-500 text-white border-orange-600",
                    },
                    {
                        icon: <Info className="size-4 shrink-0" />,
                        text: `Vous avez droit à une seule demande par mois. Toute demande soumise pour ${targetMonthName} ne pourra pas être modifiée.`,
                        style: "bg-blue-600 text-white border-blue-700",
                    }
                ];
                return <BannerTicker messages={messages} />;
            })()}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Nouvelle demande d'acompte</h2>
                            <p className="text-sm text-muted-foreground mt-1">Saisissez le montant souhaité.</p>
                        </div>
                        <div className="p-5">
                            <RequestAdvanceForm
                                isLocked={isLocked}
                                targetMonthName={targetMonthName}
                                onSubmissionError={setSubmissionError}
                                onSubmissionSuccess={() => setSubmissionError(null)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col rounded-xl border border-secondary/50 border-t-4 border-t-secondary">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-secondary">Historique de mes demandes</h2>
                        </div>
                        <div className="p-5">
                            <AdvanceHistoryTable initialData={myRequests as any} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
