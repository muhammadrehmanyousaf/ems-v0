"use client";

import React, { useEffect, useState } from "react";
import { useFavorites } from "@/context/FavoritesContext";
import { VendorAPI } from "@/lib/api/vendors";
import VendorCard from "@/components/VendorCard";
import { Heart, Loader2, Search, Filter, Star, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Vendor } from "@/lib/types";

const FavoritesPage = () => {
  const { favorites, isLoading } = useFavorites();
  const [favoriteVendors, setFavoriteVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load vendors only once and cache them
  useEffect(() => {
    const loadFavoriteVendors = async () => {
      if (favorites.length === 0) {
        setFavoriteVendors([]);
        setFilteredVendors([]);
        return;
      }

      setIsLoadingVendors(true);
      try {
        // Get all vendors and filter by favorites
        const allVendors = await VendorAPI.getAllBusinesses();
        const filteredVendors = allVendors.filter(vendor => 
          favorites.includes(Number(vendor.id))
        );
        setFavoriteVendors(filteredVendors);
        setFilteredVendors(filteredVendors);
      } catch (error) {
        console.error('Error loading favorite vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    loadFavoriteVendors();
  }, [favorites]);

  // Filter and sort vendors based on search, category, and sort
  useEffect(() => {
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
          return (a.minimumPrice || a.price || 0) - (b.minimumPrice || b.price || 0);
        case 'price-high':
          return (b.minimumPrice || b.price || 0) - (a.minimumPrice || a.price || 0);
        default:
          return 0;
      }
    });

    setFilteredVendors(filtered);
  }, [favoriteVendors, searchQuery, selectedCategory, sortBy]);

  // Get unique categories from vendors
  const categories = ['all', ...Array.from(new Set(favoriteVendors.map(v => v.type || v.subBusinessType).filter(Boolean)))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                My Favorites
              </h1>
              <p className="text-gray-600 text-lg">
                Your saved vendors and venues
              </p>
            </div>
          </div>

          {favorites.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
                <Heart className="w-4 h-4 mr-1 text-rose-500" />
                {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
              </Badge>
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                {filteredVendors.length} showing
              </Badge>
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-16 h-16 text-rose-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No favorites yet</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Start exploring amazing vendors and save your favorites by clicking the heart icon on any vendor card!
            </p>
            <div className="space-y-4">
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="/vendors">
                  <Search className="w-5 h-5 mr-2" />
                  Explore Vendors
                </a>
              </Button>
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="w-full border-2 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                <a href="/venues">
                  <MapPin className="w-5 h-5 mr-2" />
                  Browse Venues
                </a>
              </Button>
            </div>
          </div>
        ) : (
          /* Content Section */
          <div className="space-y-8">
            {/* Filters and Search */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search favorites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 border-rose-200 focus:border-rose-400"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white/50 border-rose-200 focus:border-rose-400">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/50 border-rose-200 focus:border-rose-400">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price">Price Low to High</SelectItem>
                      <SelectItem value="price-high">Price High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingVendors ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading your favorite vendors...</p>
                </div>
              </div>
            ) : (
                             /* Vendors Grid */
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    id={vendor.id}
                    name={vendor.name}
                    image={vendor.images?.[0] || "/placeholder.svg"}
                    location={vendor.location || vendor.city}
                    rating={vendor.rating}
                    reviews={vendor.reviews?.length || 0}
                    price={vendor.minimumPrice || vendor.price}
                    type={vendor.subBusinessType || vendor.type}
                    capacity={vendor.capacity}
                    amenities={vendor.amenities}
                    sponsored={vendor.sponsored}
                    isFavorite={true}
                    
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredVendors.length === 0 && !isLoadingVendors && favorites.length > 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-rose-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortBy('name');
                  }}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
