import { cn } from '@/lib/utils';

import { ReactNode } from 'react';

interface HeadingProps {
  title: ReactNode;
  description?: ReactNode;
  subHeading?: boolean;
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  subHeading
}) => {
  return (
    <div className={subHeading ? 'space-y-1' : ''}>
      <h2
        className={cn(
          `font-bold tracking-tight ${
            subHeading ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
          }`
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          `text-muted-foreground ${
            subHeading ? 'text-xs' : 'text-[13px] md:text-sm'
          }`
        )}
      >
        {description}
      </p>
    </div>
  );
};
