import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import React from 'react'
import { AvailabilityDrawer } from './availability-drawer'

type Mode = 'month' | 'week' | 'day';

export interface CalendarBusinessOption {
    id: number;
    name: string;
    hasTemplates: boolean;
}

type ToolbarProps = {
    goPrev: () => void;
    goNext: () => void;
    goToday: () => void;
    setMode: React.Dispatch<React.SetStateAction<Mode>>;
    mode: Mode;
    monthTitle: string;
    weekTitle: string;
    dayTitle: string;
    // BK-CALENDAR-SLOT-CHIPS follow-up — multi-business picker. Hidden when
    // the vendor only owns one business (auto-pick from #162 still works).
    businessOptions?: CalendarBusinessOption[];
    selectedBusinessId?: number | null;
    onBusinessChange?: (id: number) => void;
}
const Toolbar = ({
    goNext, goPrev, goToday, setMode, mode, monthTitle, weekTitle, dayTitle,
    businessOptions, selectedBusinessId, onBusinessChange,
}: ToolbarProps) => {

    const modes = [
        { value: 'month', label: 'Month' },
        { value: 'week', label: 'Week' },
        { value: 'day', label: 'Day' },
    ] as const;

    const headerTitle = mode === 'month' ? monthTitle : mode === 'week' ? weekTitle : dayTitle;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
                <span className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className='h-8 w-8' onClick={goPrev}>
                        <ChevronLeft className="size-6" />
                    </Button>
                    <Button variant="outline" size="icon" className='h-8 w-8' onClick={goNext}>
                        <ChevronRight className="size-6" />
                    </Button>
                </span>
                <Button className="hidden sm:block" variant="outline" size={'sm'} onClick={goToday}>
                    Today
                </Button>
                <span className="hidden md:block">
                    <AvailabilityDrawer />
                </span>
                {businessOptions && businessOptions.length > 1 && onBusinessChange ? (
                    <span className="hidden md:flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <Select
                            value={selectedBusinessId != null ? String(selectedBusinessId) : ''}
                            onValueChange={(v) => onBusinessChange(Number(v))}
                        >
                            <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
                                <SelectValue placeholder="Business" />
                            </SelectTrigger>
                            <SelectContent>
                                {businessOptions.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)} className="text-[12.5px]">
                                        {b.name}{!b.hasTemplates ? ' (no slots)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </span>
                ) : null}
            </div>

            <div>
                <h2 className="md:hidden text-2xl font-medium uppercase">{headerTitle.slice(0, 3)}</h2>
                <h2 className="hidden md:block text-2xl font-medium">{headerTitle}</h2>
            </div>

            <div>
                <div className="lg:hidden">
                    <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {modes.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="hidden lg:flex items-center bg-muted p-1 rounded-md">
                    {modes.map((m) => (
                        <Button
                            key={m.value}
                            onClick={() => setMode(m.value)}
                            variant={mode === m.value ? 'outline' : 'ghost'}
                            size="sm"
                            className={cn(mode === m.value ? 'hover:bg-white dark:hover:bg-background/90 font-medium text-card-foreground' : 'text-muted-foreground font-normal', 'min-w-[67px] text-[13px] h-7')}
                        >
                            {m.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Toolbar
