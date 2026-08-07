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
 *
 * WWL-525, 536, 548, 588, 596, 603 — this always rendered an `<h2>`, so every
 * page whose title comes from here had **no `h1` at all**. A screen-reader user
 * landing on the page gets no document title in the heading tree, and the
 * outline starts at level 2 with nothing above it. The page title is the h1;
 * `subHeading` marks the ones that are genuinely a section within a page and
 * those stay h2.
 */
export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  subHeading,
  eyebrow,
  className,
}) => {
  const Tag = subHeading ? 'h2' : 'h1';
  return (
    <div className={cn('space-y-1.5', className)}>
      {eyebrow ? (
        <p className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.28em] text-bridal-gold-dark">
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn(
          'font-display italic tracking-tight text-bridal-charcoal leading-tight',
          subHeading ? 'text-[18px] md:text-[20px]' : 'text-[24px] md:text-[28px]',
        )}
      >
        {title}
      </Tag>
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
