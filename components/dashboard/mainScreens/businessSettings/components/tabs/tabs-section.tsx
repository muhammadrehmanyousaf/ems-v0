'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TabDef = {
  id: string;
  label: string;
  count?: number;      // e.g., images count, packages count
  disabled?: boolean;
  dirty?: boolean;     // show unsaved changes dot
};

type TabsSectionProps = {
  tabs?: TabDef[];
  value?: string;                               // controlled
  defaultValue?: string;                        // uncontrolled
  onValueChange?: (val: string) => void;
  className?: string;
  sticky?: boolean;                              // sticky header
  ariaLabel?: string;
};

export function TabsSection({
  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'basic', label: 'Basic Information' },
    { id: 'images', label: 'Images', count: 0 },
    { id: 'packages', label: 'Packages' },
    { id: 'menus', label: 'Menus' },
    { id: 'type-specific', label: 'Details' },
  ],
  value,
  defaultValue,
  onValueChange,
  className,
  sticky = true,
  ariaLabel = 'Business settings',
}: TabsSectionProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string>(
    defaultValue ?? tabs[0]?.id ?? ''
  );
  const current = isControlled ? (value as string) : internal;

  const listRef = React.useRef<HTMLDivElement>(null);
  const btnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorRef = React.useRef<HTMLDivElement>(null);

  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  // Scroll active tab into view & move indicator
  const positionIndicator = React.useCallback(() => {
    const btn = btnRefs.current[current];
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!btn || !list || !indicator) return;

    const btnRect = btn.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const left = btnRect.left - listRect.left + list.scrollLeft;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${btnRect.width}px`;

    // Auto-scroll to keep active in view
    const padding = 24;
    if (btnRect.left < listRect.left + 8) {
      list.scrollTo({ left: left - padding, behavior: 'smooth' });
    } else if (btnRect.right > listRect.right - 8) {
      list.scrollTo({
        left: left - listRect.width + btnRect.width + padding,
        behavior: 'smooth',
      });
    }
  }, [current]);

  React.useEffect(() => {
    positionIndicator();
  }, [positionIndicator, tabs]);

  React.useEffect(() => {
    const r = new ResizeObserver(positionIndicator);
    if (listRef.current) r.observe(listRef.current);
    return () => r.disconnect();
  }, [positionIndicator]);

  // Keyboard nav: ArrowLeft/Right, Home, End
  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = tabs.filter(t => !t.disabled);
    const idx = enabled.findIndex(t => t.id === current);
    if (idx < 0) return;

    const focusTab = (i: number) => {
      const t = enabled[i];
      if (!t) return;
      setValue(t.id);
      btnRefs.current[t.id]?.focus();
    };

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusTab((idx + 1) % enabled.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusTab((idx - 1 + enabled.length) % enabled.length);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(enabled.length - 1);
        break;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'border-b',
          sticky && 'sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
        )}
      >
        <div
          ref={listRef}
          role="tablist"
          aria-label={ariaLabel}
          className={cn(
            // horizontal scroll on small screens
            'relative flex gap-8 overflow-x-auto hide-scrollbar max-w-[90vw]',
            'text-sm xlarge:text-base text-muted-foreground'
          )}
          onKeyDown={onKeyDown}
        >
          {/* Active indicator */}
          <div
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-[2px] bg-primary transition-transform duration-300 ease-out"
            style={{ width: 0, transform: 'translateX(0)' }}
          />

          {tabs.map((t) => {
            const isActive = t.id === current;
            return (
              <button
                key={t.id}
                ref={(el) => void (btnRefs.current[t.id] = el)}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={t.disabled}
                onClick={() => setValue(t.id)}
                className={cn(
                  'relative inline-flex items-center gap-2 pt-1 pb-4',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                  t.disabled && 'opacity-50 cursor-not-allowed',
                  'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm'
                )}
              >
                <span className="whitespace-nowrap">{t.label}</span>

                {typeof t.count === 'number' && (
                  <span
                    className={cn(
                      'text-[11px] leading-none rounded-full px-1.5 py-0.5',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted'
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels container (optional): render your routed content below) */}
      <div>
        {tabs.map((t) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`panel-${t.id}`}
            aria-labelledby={`tab-${t.id}`}
            // hidden={current !== t.id}
          />
        ))}
      </div>
    </div>
  );
}

export default TabsSection;