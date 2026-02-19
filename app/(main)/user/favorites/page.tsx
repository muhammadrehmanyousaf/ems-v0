"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { useVendors } from "@/hooks/use-vendors";
import VendorCard from "@/components/VendorCard";
import { FavoritesPreloader } from "@/components/favorites-preloader";
import { Heart, Loader2, Search, Filter, Star, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Vendor } from "@/lib/types";

const FavoritesPageContent = () => {
  const { favorites, isLoading: favoritesLoading, refreshFavorites } = useFavorites();
  const { data: allVendors = [], isLoading: vendorsLoading } = useVendors();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get favorite vendors from all vendors - only show if we have both favorites and vendors
  const favoriteVendors = useMemo(() => {
    if (!allVendors.length || !favorites.length) return [];
    return allVendors.filter(vendor => favorites.includes(Number(vendor.id)));
  }, [allVendors, favorites]);

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    let filtered = [...favoriteVendors];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor =>
        vendor.type?.toLowerCase() === selectedCategory.toLowerCase() ||
        vendor.subBusinessType?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort vendors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price':
          return (a.minimumPrice || 0) - (b.minimumPrice || 0);
        case 'reviews':
          return (Array.isArray(b.reviews) ? b.reviews.length : 0) - (Array.isArray(a.reviews) ? a.reviews.length : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [favoriteVendors, searchQuery, sortBy, selectedCategory]);

  const handleRefresh = async () => {
    await refreshFavorites();
  };

  // Show loading only if favorites are loading OR if we have favorites but no vendors yet
  const isLoading = favoritesLoading || (favorites.length > 0 && vendorsLoading && allVendors.length === 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton — matches the real header */}
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

        {/* Filter bar skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 skeleton-shimmer rounded-lg" />
              <div className="w-40 h-10 skeleton-shimmer rounded-lg" />
              <div className="w-40 h-10 skeleton-shimmer rounded-lg" />
            </div>
          </div>

          {/* Vendor cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Image placeholder */}
                <div className="relative h-52 skeleton-shimmer" />
                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 skeleton-shimmer rounded" />
                    <div className="h-5 w-10 skeleton-shimmer rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 skeleton-shimmer rounded-full" />
                    <div className="h-3 w-28 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-3 w-full skeleton-shimmer rounded" />
                  <div className="h-3 w-2/3 skeleton-shimmer rounded" />
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="w-8 h-8 text-purple-500 mr-3" />
                My Favorites
              </h1>
              <p className="text-gray-600 mt-2">
                {favorites.length} {favorites.length === 1 ? 'vendor' : 'vendors'} saved
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="photographer">Photographers</SelectItem>
                <SelectItem value="venue">Venues</SelectItem>
                <SelectItem value="catering">Catering</SelectItem>
                <SelectItem value="decorator">Decorators</SelectItem>
                <SelectItem value="makeup artist">Makeup Artists</SelectItem>
                <SelectItem value="henna artist">Henna Artists</SelectItem>
                <SelectItem value="car rental">Car Rental</SelectItem>
                <SelectItem value="bridal wear">Bridal Wear</SelectItem>
                <SelectItem value="wedding stationery">Wedding Stationery</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <Badge variant="secondary" className="text-sm">
                {filteredVendors.length} {filteredVendors.length === 1 ? 'result' : 'results'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring vendors and save your favorites to see them here.
              </p>
              <Button onClick={() => window.history.back()}>
                Explore Vendors
              </Button>
            </CardContent>
          </Card>
        ) : filteredVendors.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortBy('name');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                id={vendor.id}
                name={vendor.name}
                image={vendor.images?.[0] || "/placeholder.svg"}
                location={vendor.city || vendor.location || "Location not specified"}
                rating={vendor.rating || 0}
                reviews={Array.isArray(vendor.reviews) ? vendor.reviews.length : 0}
                price={vendor.minimumPrice || 0}
                type={vendor.type || vendor.subBusinessType || "Vendor"}
                vendorType={vendor.subBusinessType}
                capacity={vendor.capacity}
                amenities={vendor.amenities || []}
                sponsored={vendor.sponsored}
                showBookButton={true}
                showDetails={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FavoritesPage = () => {
  return (
    <FavoritesPreloader>
      <FavoritesPageContent />
    </FavoritesPreloader>
  );
};

export default FavoritesPage;
