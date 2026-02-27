"use client"
import { Calendar } from "lucide-react"

type Balances = {
    CP: { max: number, consumed: number },
    MA: { max: number, consumed: number },
    CSS: { max: number, consumed: number }
}

export function LeaveBalanceConfig({ balances }: { balances: Balances }) {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-card text-card-foreground p-5 rounded-xl border border-border flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                <h2 className="text-lg font-medium">Mes soldes de droits</h2>
                <div className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-md bg-muted/10 text-sm">
                    <span className="text-muted-foreground mr-2 capitalize">Au {today}</span>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                <BalanceCircle label="CP" current={Math.max(0, balances.CP.max - balances.CP.consumed)} max={balances.CP.max} color="text-red-600 border-red-500" />
                <BalanceCircle label="RSS/CSS" current={Math.max(0, balances.CSS.max - balances.CSS.consumed)} max={balances.CSS.max} color="text-blue-500 border-blue-500" />
            </div>
        </div>
    )
}

function BalanceCircle({ label, current, max, color }: { label: string, current: number, max: number, color: string }) {
    // Format the number to match exactly the "X,00" requested UI style
    const formatNumber = (num: number) => {
        const whole = Math.floor(num);
        const frac = num % 1 === 0.5 ? '50' : '00';
        return `${whole},${frac}`;
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`w-[72px] h-[72px] rounded-full border flex items-center justify-center font-bold text-xl ${color}`}>
                <span className="text-foreground">{formatNumber(current)}</span>
            </div>
            <span className="text-[11px] font-bold text-foreground mt-2">{label}</span>
            <div className="flex items-center gap-1 mt-0.5 border-b-2 border-primary text-[10px] text-muted-foreground pb-0.5">
                <span>{formatNumber(max)}</span>
            </div>
        </div>
    )
}
