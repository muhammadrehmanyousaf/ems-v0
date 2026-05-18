"use client";

/**
 * BK-100.55 Layer 3 — Shared vendor-detail-page wrapper.
 *
 * Consolidates the boilerplate that each category-specific
 * `[id]/page.tsx` was duplicating: fetch by ID with retry + localStorage
 * fallback, loading spinner, error state with retry, not-found state.
 *
 * Existing category-specific detail pages still inline the same logic
 * (we don't refactor them to avoid touching live routes). New category
 * routes shipped under BK-100.55 Layer 3 use this shared wrapper so we
 * don't introduce ~14 near-identical 138-line files.
 *
 * The `categoryLabel` prop drives only the displayed copy; the data
 * fetch + render are identical to the photographer detail page so the
 * UX is consistent across the whole catalogue.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile";
import type { Vendor } from "@/lib/types";
import { VendorAPI } from "@/lib/api/vendors";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

interface VendorDetailPageProps {
  /** Singular display label, e.g. "wedding officiant", "florist". */
  categoryLabel: string;
}

export default function VendorDetailPage({ categoryLabel }: VendorDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!id || typeof id !== "string") {
        setError("Invalid vendor ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const vendorData = await VendorAPI.getBusinessById(id);

        if (vendorData) {
          setVendor(vendorData);
        } else {
          throw new Error(`${capitalize(categoryLabel)} not found`);
        }
      } catch (err) {
        // localStorage fallback — matches the pattern used by the
        // existing category detail pages.
        try {
          const storedVendors = localStorage.getItem("all_vendors");
          if (storedVendors) {
            const parsedVendors = JSON.parse(storedVendors);
            const storedVendor = parsedVendors.find(
              (v: Vendor) => v.id.toString() === id,
            );
            if (storedVendor) {
              setVendor(storedVendor);
              return;
            }
          }
        } catch (_) {
          /* swallow localStorage errors */
        }

        setError(
          err instanceof Error
            ? err.message
            : `Failed to load ${categoryLabel} details. Please try again.`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorDetails();
  }, [id, retryCount, categoryLabel]);

  const handleRetry = () => setRetryCount((p) => p + 1);
  const handleGoBack = () => router.back();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-bridal-gold-dark mx-auto mb-4" />
          <p className="text-neutral-600 text-lg">
            Loading {categoryLabel} details...
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Please wait while we fetch the {categoryLabel} information
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Unable to load {categoryLabel}
          </h2>
          <p className="text-red-600 mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-bridal-gold hover:bg-bridal-gold-dark text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {capitalize(categoryLabel)} not found
          </h2>
          <p className="text-neutral-600 mb-6">
            The {categoryLabel} you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button
            onClick={handleGoBack}
            className="bg-bridal-gold hover:bg-bridal-gold-dark text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return <VendorDetailsMobile vendor={vendor} />;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
