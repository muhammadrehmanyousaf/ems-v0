/**
 * Phase 4 #10.3 — Vendor reliability API client.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface ReliabilityBreakdown {
  effectiveRating: number;
  ratingPts: number;
  volumePts: number;
  verificationPts: number;
  completionPts: number;
  disputePts: number;
  completenessPts: number;
}

export interface ReliabilityInputs {
  avgRating: number;
  reviewCount: number;
  disputeCount: number;
  completionCount: number;
  cancellationCount: number;
  verificationTier: number;
  completenessScore: number;
  yearsInBusiness: number;
  weddingsCompleted: number;
}

export interface ReliabilitySuggestion {
  kind: string;
  title: string;
  detail: string;
  estimatedGain: number;
}

export interface BusinessReliability {
  businessId: number;
  name: string;
  score: number; // 0-100
  tier: 'newcomer' | 'rising' | 'trusted' | 'premium' | 'elite';
  badges: string[];
  breakdown: ReliabilityBreakdown;
  inputs: ReliabilityInputs;
  suggestions: ReliabilitySuggestion[];
}

export const TIER_LABELS: Record<BusinessReliability['tier'], string> = {
  newcomer: 'Newcomer',
  rising: 'Rising',
  trusted: 'Trusted',
  premium: 'Premium',
  elite: 'Elite',
};

export const TIER_TONES: Record<
  BusinessReliability['tier'],
  { bg: string; text: string; border: string }
> = {
  newcomer: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
  rising:   { bg: 'bg-blue-50',     text: 'text-blue-800',    border: 'border-blue-300' },
  trusted:  { bg: 'bg-emerald-50',  text: 'text-emerald-800', border: 'border-emerald-300' },
  premium:  { bg: 'bg-violet-50',   text: 'text-violet-800',  border: 'border-violet-300' },
  elite:    { bg: 'bg-amber-50',    text: 'text-amber-800',   border: 'border-amber-300' },
};

export const BADGE_LABELS: Record<string, string> = {
  top_vendor: 'Top Vendor',
  verified: 'Verified',
  tier3_verified: 'CNIC Verified',
  established: 'Established',
  dispute_free: 'Dispute-free',
  high_volume: 'High Volume',
  quick_responder: 'Quick Responder',
};

export class ReliabilityAPI {
  static async getMyScores(): Promise<{ businesses: BusinessReliability[] }> {
    const res = await axiosInstance.get('/api/v1/businesses/my-reliability');
    return res.data?.data ?? { businesses: [] };
  }
}
