import { cn } from "@/lib/utils";
import { IoStar } from "react-icons/io5";
import { IoStarHalf } from "react-icons/io5";
import { IoStarOutline } from "react-icons/io5";

export const StartComponent: React.FC<{ value: number, dialog?: boolean }> = ({ value , dialog}) => {
    const v = Math.max(0, Math.min(5, value));
    const full = Math.floor(v);
    const hasHalf = v - full >= 0.5;

    return (
        <div className="flex items-center gap-1" aria-label={`${v} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => {
                if (i < full) return <IoStar key={`f-${i}`} className={cn("text-yellow-500", dialog ? 'size-5' : 'size-4')} />;
                if (i === full && hasHalf) return <IoStarHalf key="half" className={cn("text-yellow-500", dialog ? 'size-5' : 'size-4')} />;
                return <IoStarOutline key={`e-${i}`} className={cn("text-yellow-500", dialog ? 'size-5' : 'size-4')} />;
            })}
        </div>
    );
};
