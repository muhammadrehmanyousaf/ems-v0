'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Options } from 'nuqs';
import { useTransition } from 'react';

interface DataTableSearchProps {
  searchKey: string;
  searchQuery: string;
  setSearchQuery: (
    value: string | ((old: string) => string | null) | null,
    options?: Options<any> | undefined
  ) => Promise<URLSearchParams>;
  setPage: <Shallow>(
    value: number | ((old: number) => number | null) | null,
    options?: Options<Shallow> | undefined
  ) => Promise<URLSearchParams>;
  placeholder?: string;
}

export function DataTableSearch({
  searchKey,
  searchQuery,
  setSearchQuery,
  setPage,
  placeholder
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setSearchQuery(value, { startTransition });
    setPage(1);
  };

  return (
    <Input
      placeholder={`Search ${placeholder || searchKey}...`}
      value={searchQuery ?? ''}
      onChange={(e) => handleSearch(e.target.value)}
      className={cn(
        'w-full text-xs md:max-w-sm md:text-sm',
        isLoading && 'animate-pulse'
      )}
    />
  );
}
