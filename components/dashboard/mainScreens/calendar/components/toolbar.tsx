import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'

type Mode = 'month' | 'week' | 'day';

type ToolbarProps = {
    goPrev: () => void;
    goNext: () => void;
    goToday: () => void;
    setMode: React.Dispatch<React.SetStateAction<Mode>>;
    mode: Mode;
    monthTitle: string;
    weekTitle: string;
    dayTitle: string
}
const Toolbar = ({ goNext, goPrev, goToday, setMode, mode, monthTitle, weekTitle, dayTitle }: ToolbarProps) => {

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
