"use client"

import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { AppointmentRequest } from "@prisma/client"
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

type RequestWithUser = AppointmentRequest & {
    user: {
        name: string | null
        email: string | null
        firstName: string | null
        lastName: string | null
        image: string | null
    }
}

export function AppointmentsCalendar({
    data,
    onSelectAppointment
}: {
    data: RequestWithUser[],
    onSelectAppointment: (req: RequestWithUser) => void
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const validAppointments = useMemo(() => {
        return data.filter(req => req.status === 'APPROVED' && req.appointmentDate)
    }, [data])

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
        return eachDayOfInterval({ start, end })
    }, [currentMonth])

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    return (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                        Aujourd'hui
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-slate-100/50">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 bg-slate-200 gap-px">
                {days.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isToday = isSameDay(day, new Date())

                    const dayAppointments = validAppointments.filter(req =>
                        req.appointmentDate && isSameDay(new Date(req.appointmentDate), day)
                    ).sort((a, b) => new Date(a.appointmentDate!).getTime() - new Date(b.appointmentDate!).getTime())

                    return (
                        <div
                            key={day.toISOString() + idx}
                            className={`min-h-[120px] bg-white p-2 transition-colors ${!isCurrentMonth ? 'opacity-50 bg-slate-50' : ''} ${isToday ? 'bg-blue-50/30' : ''} hover:bg-slate-50`}
                        >
                            <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1.5 flex flex-col h-[calc(100%-32px)] overflow-y-auto no-scrollbar pb-1">
                                {dayAppointments.map(app => (
                                    <div
                                        key={app.id}
                                        onClick={() => onSelectAppointment(app)}
                                        className={`text-[10px] p-1.5 rounded-md cursor-pointer border hover:shadow-sm transition-all truncate group ${app.type === 'CONVOCATION' ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'}`}
                                    >
                                        <div className="font-bold flex items-center justify-between">
                                            <span>
                                                {format(new Date(app.appointmentDate!), 'HH:mm')}
                                            </span>
                                            {app.appointmentMode === 'TELEPHONE' ? <Phone className="w-3 h-3 opacity-50" /> : <MapPin className="w-3 h-3 opacity-50" />}
                                        </div>
                                        <div className="truncate font-medium opacity-90 group-hover:opacity-100">
                                            {app.user.firstName} {app.user.lastName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>
    )
}
