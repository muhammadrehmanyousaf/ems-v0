'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { Slash } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumbs() {
  const items = useBreadcrumbs();

  if (items?.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items?.map((item, index) => (
          <Fragment key={item.title.replace(/-/g, ' ')}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className="hidden md:block">
                {/* BUG-017 — a segment with no link (a grouping container like
                    "Admin" that has no index page) renders as plain text rather
                    than a link that 404s. */}
                {item.link ? (
                  <BreadcrumbLink href={item.link}>
                    {item.title
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, (char, index) =>
                        index > 0 ? char.toUpperCase() : char
                      )}
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">
                    {item.title
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, (char, index) =>
                        index > 0 ? char.toUpperCase() : char
                      )}
                  </span>
                )}
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className="hidden md:block">
                <Slash />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage
                className={`
                  max-w-[150px] truncate sm:max-w-[160px] md:max-w-none
                `}
              >
                {item.title
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (char, index) =>
                    index > 0 ? char.toUpperCase() : char
                  )}
              </BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
