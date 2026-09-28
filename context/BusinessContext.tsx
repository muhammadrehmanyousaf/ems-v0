'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ApiBusiness } from '@/lib/api/dashboard';
import { useMyBusinesses } from '@/hooks/use-my-businesses';
import { businessListKey } from '@/lib/query/business-keys';
import { useUser } from './UserContext';

interface BusinessContextType {
    businesses: ApiBusiness[];
    business: ApiBusiness | null;     // first / default business (convenience)
    loading: boolean;
    refreshBusiness: (silent?: boolean) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

/**
 * Re-exported for the call sites that already import it from here. The key
 * itself now lives in `lib/query/business-keys` so `useMyBusinesses` can share
 * it without importing this provider.
 */
export { businessListKey };

/**
 * The vendor's businesses — fetched once per session, not once per screen.
 *
 * WW-PERF. Measured across 18 console screens: 210 requests, and NINE of every
 * ten on a screen were the shell asking the same six questions again, with only
 * one request for the screen's actual content. `/businesses/user-business` was
 * one of those six.
 *
 * This held the list in `useState` and refetched it from a `useEffect` on every
 * mount, so nothing was shared and nothing survived. React Query gives it one
 * cache key: the provider can mount as often as it likes, and the request
 * happens once while the data stays fresh. `refreshBusiness()` keeps working —
 * it now invalidates the key, which updates every consumer at once instead of
 * only the provider that called it.
 *
 * `staleTime` is generous because a vendor's own business list changes when
 * THEY change it, and the mutations that change it invalidate this key.
 */
export const BusinessProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useUser();
    const qc = useQueryClient();
    const enabled = !!isAuthenticated && !!user?.isVendor;

    // One definition, shared with every screen: the provider is just another
    // reader of `useMyBusinesses`, so it cannot drift from the fourteen screens
    // that call the hook directly.
    const q = useMyBusinesses({ enabled });

    const refreshBusiness = useCallback(
        async (_silent = false) => {
            await qc.invalidateQueries({ queryKey: businessListKey });
        },
        [qc]
    );

    const businesses = enabled ? q.data ?? [] : [];

    return (
        <BusinessContext.Provider value={{
            businesses,
            business: businesses[0] ?? null,
            loading: enabled && q.isLoading,
            refreshBusiness,
        }}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const ctx = useContext(BusinessContext);
    if (!ctx) throw new Error('useBusiness must be used within a BusinessProvider');
    return ctx;
};
