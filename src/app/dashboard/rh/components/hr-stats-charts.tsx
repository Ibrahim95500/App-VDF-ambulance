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

interface StatProps {
    requestsByCategory: { name: string, value: number }[];
    requestsByUser: { name: string, value: number }[];
    requestsByMonth: { name: string, value: number }[];
    hideUserTab?: boolean;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#1e40af'];

export function HRStatsCharts({ requestsByCategory, requestsByUser, requestsByMonth, hideUserTab = false }: StatProps) {
    const [activeTab, setActiveTab] = useState<'category' | 'user' | 'month'>('category');

    return (
        <Card className="border-secondary/50 shadow-sm border-t-4 border-t-secondary w-full">
            <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold">Statistiques des Demandes</CardTitle>
                <CardDescription>Analyse complète des demandes de vos collaborateurs.</CardDescription>

                <div className="flex gap-2 pt-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Button
                        size="sm"
                        variant={activeTab === 'category' ? 'secondary' : 'outline'}
                        onClick={() => setActiveTab('category')}
                        className="flex-shrink-0"
                    >
                        <PieChartIcon className="w-4 h-4 mr-2" />
                        Par Thématique
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
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={requestsByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {requestsByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`${value} demande(s)`, 'Total']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                            {requestsByCategory.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={requestsByUser.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        formatter={(value: any) => [`${value} demande(s)`, 'Total']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                )}

                {/* Graphique Évolution (LineChart) */}
                {activeTab === 'month' && (
                    <div className="h-[300px] w-full">
                        {requestsByMonth.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground italic text-sm">Aucune donnée disponible.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={requestsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value: any) => [`${value} demande(s)`, 'Total']}
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

