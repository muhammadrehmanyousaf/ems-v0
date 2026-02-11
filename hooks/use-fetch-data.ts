'use client';

import instance from '@/lib/axiosConfig';
import {
    useQuery,
    type UseQueryOptions,
    type QueryKey
} from '@tanstack/react-query';

type FetchParams = {
    endpoint: string;
    queryKey: string | string[];
    enabled?: boolean;
    Params?: Record<string, any>;
    treatApiFailureAsError?: boolean;
    queryOptions?: Omit<
        UseQueryOptions<any, Error, any, QueryKey>,
        'queryKey' | 'queryFn' | 'enabled'
    >;
};

const buildParams = ({
    Params
}: Pick<
    FetchParams,
    'Params'
>) => {
    const params: Record<string, any> = {};

    if (Params && typeof Params === 'object') {
        for (const [k, v] of Object.entries(Params)) {
            if (
                v !== undefined &&
                v !== null &&
                !(typeof v === 'string' && v.trim() === '')
            ) {
                params[k] = v;
            }
        }
    }
    return params;
};

const fetcher = async ({
    endpoint,
    params,
    treatApiFailureAsError
}: {
    endpoint: string;
    params: Record<string, any>;
    treatApiFailureAsError?: boolean;
}) => {
    const hasParams = Object.keys(params).length > 0;
    const { data } = await instance.get(endpoint, hasParams ? { params } : undefined);

    if (
        treatApiFailureAsError &&
        data &&
        typeof data === 'object' &&
        data.success === false
    ) {
        throw new Error(
            data.message || data.error || `Request failed for ${endpoint}`
        );
    }
    return data;
};

export const useFetchData = ({
    endpoint,
    queryKey,
    enabled = true,
    Params,
    treatApiFailureAsError = false,
    queryOptions
}: FetchParams) => {
    const params = buildParams({
        Params
    });
    const key: QueryKey = Array.isArray(queryKey)
        ? [endpoint, ...queryKey, params]
        : [endpoint, queryKey, params];

    return useQuery({
        queryKey: key,
        queryFn: () => fetcher({ endpoint, params, treatApiFailureAsError }),
        enabled,
        retry: 1,
        staleTime: 30_000,

        placeholderData: (prev) => prev,

        ...(queryOptions ?? {})
    });
};
