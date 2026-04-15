"use client";

import { useMemo } from "react";
import { ShieldAlert, Zap, ServerCrash, CheckCircle2 } from "lucide-react";

interface Ticket {
    status: string;
    urgency: string;
    createdAt: Date;
}

export function ITSupportKpi({ tickets }: { tickets: Ticket[] }) {
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            open: tickets.filter(t => t.status === "OPEN").length,
            inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
            critical: tickets.filter(t => t.urgency === "CRITICAL" && t.status !== "CLOSED" && t.status !== "RESOLVED").length,
            resolvedToday: tickets.filter(t => t.status === "RESOLVED" && new Date(t.createdAt) >= today).length,
            totalActive: tickets.filter(t => t.status !== "CLOSED").length,
        };
    }, [tickets]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="absolute -right-4 -top-4 opacity-10">
                    <ShieldAlert className="w-24 h-24 text-blue-400" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-900/40 rounded-lg border border-blue-800/50">
                        <ShieldAlert className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tickets Actifs</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-white">{stats.totalActive}</span>
                    <span className="text-sm text-slate-500 mb-1 font-medium">À traiter</span>
                </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-orange-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="absolute -right-4 -top-4 opacity-10">
                    <Zap className="w-24 h-24 text-orange-400" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-900/40 rounded-lg border border-orange-800/50">
                        <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">En cours</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-orange-400">{stats.inProgress}</span>
                    <span className="text-sm text-slate-500 mb-1 font-medium">En résolution</span>
                </div>
            </div>

            <div className="flex bg-gradient-to-bl from-red-950/50 to-slate-900 border border-red-900/30 rounded-2xl overflow-hidden relative shadow-xl">
                <div className="flex-1 p-5 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <ServerCrash className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Critiques</span>
                    </div>
                    <div className="text-4xl font-black text-red-500 drop-shadow-md">
                        {stats.critical}
                    </div>
                </div>
                <div className="w-32 bg-red-900/20 flex flex-col justify-center items-center border-l border-red-900/30">
                    <div className="text-[10px] uppercase font-bold text-red-400/70 mb-1 tracking-widest text-center px-2">Bloquants</div>
                    <div className="animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="absolute -right-4 -top-4 opacity-10">
                    <CheckCircle2 className="w-24 h-24 text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-800/50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Résolus</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-emerald-400">{stats.resolvedToday}</span>
                    <span className="text-sm text-slate-500 mb-1 font-medium">Aujourd'hui</span>
                </div>
            </div>
        </div>
    );
}
