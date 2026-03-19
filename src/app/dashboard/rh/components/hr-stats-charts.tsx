"use client"
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    LineChart, Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChartIcon, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

interface StatProps {
    requestsByCategory: { name: string, value: number }[];
    requestsByUser: { name: string, value?: number, rdv?: number, convocation?: number }[];
    requestsByMonth: { name: string, value: number }[];
    hideUserTab?: boolean;
    categoryLabel?: string;
    title?: string;
    description?: string;
    colors?: string[];
}

const DEFAULT_COLORS = [
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316'  // orange-500
];

export function HRStatsCharts({
    requestsByCategory,
    requestsByUser,
    requestsByMonth,
    hideUserTab = false,
    categoryLabel = "Par Thématique",
    title = "Statistiques des Demandes",
    description = "Analyse complète des demandes de vos collaborateurs.",
    colors = DEFAULT_COLORS
}: StatProps) {
    const [activeTab, setActiveTab] = useState<'category' | 'user' | 'month'>('category');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Group Top 5 categories + "Autres" if there are > 6 items
    const pieData = requestsByCategory.length <= 6
        ? requestsByCategory
        : (() => {
            const sorted = [...requestsByCategory].sort((a, b) => b.value - a.value);
            const top = sorted.slice(0, 5);
            const others = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
            return [...top, { name: 'Autres', value: others }];
        })();

    const isSplitBar = requestsByUser.length > 0 && requestsByUser[0].rdv !== undefined;

    return (
        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary w-full">
            <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>

                <div className="flex gap-2 pt-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Button
                        size="sm"
                        variant={activeTab === 'category' ? 'secondary' : 'outline'}
                        onClick={() => setActiveTab('category')}
                        className="flex-shrink-0"
                    >
                        <PieChartIcon className="w-4 h-4 mr-2" />
                        {categoryLabel}
                    </Button>
                    {!hideUserTab && (
                        <Button
                            size="sm"
                            variant={activeTab === 'user' ? 'secondary' : 'outline'}
                            onClick={() => setActiveTab('user')}
                            className="flex-shrink-0"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Par Salarié
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant={activeTab === 'month' ? 'secondary' : 'outline'}
                        onClick={() => setActiveTab('month')}
                        className="flex-shrink-0"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Évolution Mensuelle
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">

                {/* Graphique par Thématique (PieChart) */}
                {activeTab === 'category' && (
                    <div className="h-[300px] w-full flex flex-col items-center">
                        {requestsByCategory.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">Aucune donnée disponible.</div>
                        ) : isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any, name: any) => [`${value}`, `Total ${name}`]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                                    <span className="truncate max-w-[120px]" title={entry.name}>{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Graphique par Salarié (BarChart) */}
                {activeTab === 'user' && (
                    <div className="h-[300px] w-full">
                        {requestsByUser.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">Aucune donnée disponible.</div>
                        ) : isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <BarChart data={requestsByUser.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white border border-slate-200 shadow-md rounded-lg p-3 text-sm">
                                                        <p className="font-bold text-slate-800 mb-1">{label}</p>
                                                        {payload.map((p: any, i: number) => (
                                                            <p key={i} style={{ color: p.fill }} className="font-semibold">
                                                                {p.name} : {p.value}
                                                            </p>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {isSplitBar ? (
                                        <>
                                            <Bar dataKey="rdv" name="Rendez-vous" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} stackId="a" />
                                            <Bar dataKey="convocation" name="Convocation" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} stackId="a" />
                                        </>
                                    ) : (
                                        <Bar dataKey="value" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {/* Custom Legend */}
                        {isSplitBar && (
                            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                    <span>Rendez-vous (Salarié)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm bg-violet-500" />
                                    <span>Convocation (RH)</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Graphique Évolution (LineChart) */}
                {activeTab === 'month' && (
                    <div className="h-[300px] w-full">
                        {requestsByMonth.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">Aucune donnée disponible.</div>
                        ) : isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <LineChart data={requestsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [`${value} demande(s)`, 'Volume']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}

