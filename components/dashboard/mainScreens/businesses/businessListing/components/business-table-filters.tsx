'use client';
import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';

const BusinessTableFilters = () => {
    const [searchQuery, setSearchQuery] = useQueryState(
        'q',
        searchParams.q
            .withOptions({ shallow: false, throttleMs: 1000 })
            .withDefault('')
    );

    const [page, setPage] = useQueryState(
        'page',
        searchParams.page.withDefault(1)
    );

    const isAnyFilterActive = useMemo(() => {
        return !!searchQuery;
    }, [searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        page,
        setPage,
        isAnyFilterActive
    };
};

export default BusinessTableFilters;
