'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BusinessesAPI, type ApiBusiness } from '@/lib/api/dashboard';
import { useUser } from './UserContext';

interface BusinessContextType {
    businesses: ApiBusiness[];
    business: ApiBusiness | null;     // first / default business (convenience)
    loading: boolean;
    refreshBusiness: (silent?: boolean) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useUser();
    const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshBusiness = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await BusinessesAPI.getUserBusinesses();
            setBusinesses(data);
        } catch {
            // silent — don't clear existing data on transient errors
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Fetch on mount once user is authenticated and is a vendor
    useEffect(() => {
        if (isAuthenticated && user?.isVendor) {
            refreshBusiness();
        } else {
            setBusinesses([]);
        }
    }, [isAuthenticated, user?.isVendor, refreshBusiness]);

    return (
        <BusinessContext.Provider value={{
            businesses,
            business: businesses[0] ?? null,
            loading,
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
