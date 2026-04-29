"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { FavoritesAPI } from "@/lib/api/favorites";
import VendorCard from "@/components/VendorCard";
import { Heart, Loader2, Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

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
    loadVendors();
  }, [loadVendors]);

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
          v.city?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter(
        (v) =>
          v.type?.toLowerCase() === selectedCategory.toLowerCase() ||
          v.subBusinessType?.toLowerCase() === selectedCategory.toLowerCase()
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

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 skeleton-shimmer rounded-lg" />
                  <div className="h-8 w-44 skeleton-shimmer rounded-lg" />
                </div>
                <div className="h-4 w-28 skeleton-shimmer rounded" />
              </div>
              <div className="h-9 w-24 skeleton-shimmer rounded-lg" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 skeleton-shimmer rounded-lg" />
              <div className="w-40 h-10 skeleton-shimmer rounded-lg" />
              <div className="w-40 h-10 skeleton-shimmer rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative h-52 skeleton-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 skeleton-shimmer rounded" />
                    <div className="h-5 w-10 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-3 w-28 skeleton-shimmer rounded" />
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="h-5 w-24 skeleton-shimmer rounded" />
                    <div className="h-8 w-20 skeleton-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-purple-500 fill-purple-100" />
                My Favorites
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"} saved
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Empty state — no favorites at all */}
        {vendors.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-sm">
            <CardContent className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-purple-200" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                Tap the heart icon on any vendor to save them here for quick access.
              </p>
              <Button
                onClick={() => router.push("/vendors")}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                Explore Vendors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search your favorites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-gray-200 focus:border-purple-400"
                  />
                </div>

                {/* Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-44 border-gray-200">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Photographer">Photographers</SelectItem>
                    <SelectItem value="Wedding venue">Venues</SelectItem>
                    <SelectItem value="Catering">Catering</SelectItem>
                    <SelectItem value="Decorator">Decorators</SelectItem>
                    <SelectItem value="Makeup artist">Makeup Artists</SelectItem>
                    <SelectItem value="Henna artist">Henna Artists</SelectItem>
                    <SelectItem value="Car rental">Car Rental</SelectItem>
                    <SelectItem value="Bridal wearing">Bridal Wear</SelectItem>
                    <SelectItem value="Wedding Invitations and Stationery">Stationery</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-36 border-gray-200">
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
                  <Badge variant="secondary" className="text-sm px-3 py-1.5 whitespace-nowrap">
                    {filteredVendors.length} result{filteredVendors.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </div>

            {/* No results after filtering */}
            {filteredVendors.length === 0 ? (
              <Card className="text-center py-12 border-0 shadow-sm">
                <CardContent className="flex flex-col items-center">
                  <Search className="w-12 h-12 text-gray-200 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-5">Try adjusting your search or filters.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSortBy("name");
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    id={vendor.id}
                    name={vendor.name}
                    image={vendor.images?.[0] || "/placeholder.svg"}
                    location={vendor.location || vendor.city || "Location not specified"}
                    rating={vendor.rating || 0}
                    reviews={Array.isArray(vendor.reviews) ? vendor.reviews.length : 0}
                    price={vendor.minimumPrice || vendor.price || null}
                    type={vendor.type || vendor.subBusinessType || "Vendor"}
                    vendorType={vendor.subBusinessType}
                    capacity={vendor.maxCapacity || vendor.capacity}
                    amenities={vendor.amenities || []}
                    sponsored={vendor.sponsored}
                    showBookButton={true}
                    showDetails={true}
                    onFavoriteToggle={(id, nowFavorited) => {
                      if (!nowFavorited) {
                        setVendors((prev) => prev.filter((v) => Number(v.id) !== Number(id)))
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
