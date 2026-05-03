import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface HeadingProps {
  title: ReactNode;
  description?: ReactNode;
  subHeading?: boolean;
  /** Caps eyebrow text shown above the title (e.g. "Console · Bookings"). */
  eyebrow?: ReactNode;
  className?: string;
}

/**
 * Editorial heading — caps eyebrow + Playfair-italic title + muted description.
 * Used across the vendor / admin dashboard views.
 */
export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  subHeading,
  eyebrow,
  className,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {eyebrow ? (
        <p className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.28em] text-bridal-gold-dark">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'font-display italic tracking-tight text-bridal-charcoal leading-tight',
          subHeading ? 'text-[18px] md:text-[20px]' : 'text-[24px] md:text-[28px]',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'text-muted-foreground',
            subHeading ? 'text-[12px]' : 'text-[13px] md:text-sm',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
};
