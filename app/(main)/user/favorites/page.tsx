"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { FavoritesAPI } from "@/lib/api/favorites";
import VendorCard from "@/components/VendorCard";
import { Heart, Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/user-dashboard";

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, refreshFavorites } = useFavorites();

  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FavoritesAPI.getFavoriteVendors();
      setVendors(data);
    } catch {
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
    loadVendors();
  }, [loadVendors, refreshFavorites]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFavorites();
    await loadVendors();
    setIsRefreshing(false);
  };

  const filteredVendors = useMemo(() => {
    let list = [...vendors];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q),
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter(
        (v) =>
          v.type?.toLowerCase() === selectedCategory.toLowerCase() ||
          v.subBusinessType?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          return (a.minimumPrice || 0) - (b.minimumPrice || 0);
        case "reviews":
          return (
            (Array.isArray(b.reviews) ? b.reviews.length : 0) -
            (Array.isArray(a.reviews) ? a.reviews.length : 0)
          );
        default:
          return 0;
      }
    });

    return list;
  }, [vendors, searchQuery, sortBy, selectedCategory]);

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Favourites</span>
    </>
  );

  const headerActions = (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isRefreshing}
      className="gap-1.5"
    >
      <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
      {isRefreshing ? "Refreshing…" : "Refresh"}
    </Button>
  );

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="My favourites"
          description="Vendors you've saved for later — quick access in one place."
          actions={headerActions}
        />
        <SectionCard>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </SectionCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="My favourites"
        description={`${vendors.length} ${vendors.length === 1 ? "vendor" : "vendors"} saved for quick access.`}
        actions={headerActions}
      />

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-6" />}
          title="No favourites yet"
          description="Tap the heart icon on any vendor to save them here."
          action={
            <Button onClick={() => router.push("/vendors")} size="sm">
              Explore vendors
            </Button>
          }
        />
      ) : (
        <>
          {/* Filters */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search your favourites…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-44 h-10">
                  <SlidersHorizontal className="size-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Photographer">Photographers</SelectItem>
                  <SelectItem value="Wedding venue">Venues</SelectItem>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Decorator">Decorators</SelectItem>
                  <SelectItem value="Makeup artist">Makeup artists</SelectItem>
                  <SelectItem value="Henna artist">Henna artists</SelectItem>
                  <SelectItem value="Car rental">Car rental</SelectItem>
                  <SelectItem value="Bridal wearing">Bridal wear</SelectItem>
                  <SelectItem value="Wedding Invitations and Stationery">
                    Stationery
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-36 h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-end sm:justify-start">
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                  {filteredVendors.length}{" "}
                  result{filteredVendors.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </SectionCard>

          {filteredVendors.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No results found"
              description="Try adjusting your search or filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSortBy("name");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.name}
                  image={vendor.images?.[0] || "/placeholder.svg"}
                  location={vendor.location || vendor.city || "Location not specified"}
                  rating={vendor.rating || 0}
                  reviews={
                    vendor.reviewCount ??
                    (Array.isArray(vendor.reviews) ? vendor.reviews.length : 0)
                  }
                  price={vendor.minimumPrice || vendor.price || null}
                  type={vendor.type || vendor.subBusinessType || "Vendor"}
                  vendorType={vendor.subBusinessType}
                  capacity={vendor.maxCapacity || vendor.capacity}
                  amenities={vendor.amenities || []}
                  sponsored={vendor.sponsored}
                  showBookButton={true}
                  showDetails={true}
                  business={vendor}
                  onFavoriteToggle={(id, nowFavorited) => {
                    if (!nowFavorited) {
                      setVendors((prev) =>
                        prev.filter((v) => Number(v.id) !== Number(id)),
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
