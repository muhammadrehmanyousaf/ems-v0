"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Heart, MapPin, Star, Phone, Mail, Calendar, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useFavoritesContext } from "@/contexts/FavoritesContext"
import { VendorAPI } from "@/lib/api/vendors"

interface FavoriteItem {
  id: string;
  name: string;
  type: 'vendor' | 'venue';
  category: string;
  location: string;
  rating: number;
  image: string;
  description: string;
  contact: {
    phone: string;
    email: string;
  };
}

const FavoritesPage = () => {
  const [filterType, setFilterType] = useState<'all' | 'vendor' | 'venue'>('all');
  const [vendorImages, setVendorImages] = useState<{[key: string]: string}>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  
  // Use the favorites context
  const { 
    state: { favorites, isLoading, error },
    removeFavorite 
  } = useFavoritesContext();

  // Fetch vendor images when favorites change
  useEffect(() => {
    const fetchVendorImages = async () => {
      if (!Array.isArray(favorites) || favorites.length === 0) return;
      
      setImagesLoading(true);
      const imagePromises = favorites.map(async (fav) => {
        try {
          const vendorData = await VendorAPI.getBusinessById(fav.businessId);
          if (vendorData && vendorData.images && vendorData.images.length > 0) {
            return { businessId: fav.businessId, image: vendorData.images[0] };
          }
        } catch (error) {
          console.log('Failed to fetch image for business:', fav.businessId);
        }
        return null;
      });
      
      const results = await Promise.all(imagePromises);
      const newImages: {[key: string]: string} = {};
      results.forEach(result => {
        if (result) {
          newImages[result.businessId] = result.image;
        }
      });
      
      setVendorImages(newImages);
      setImagesLoading(false);
    };
    
    fetchVendorImages();
  }, [favorites]);

  // Handle remove favorite
  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Helper function to determine if a business type is a venue
  const isVenueType = (businessType: string | undefined): boolean => {
    if (!businessType) return false;
    const venueTypes = [
      'Wedding venue', 'Venue', 'Banquet Hall', 'Hotel', 'Resort', 'Garden', 
      'Farmhouse', 'Destination Venue', 'Wedding Hall', 'Marriage Hall'
    ];
    return venueTypes.some(type => 
      businessType.toLowerCase().includes(type.toLowerCase())
    );
  };

  // Transform API favorites to match the UI structure
  const transformedFavorites = Array.isArray(favorites) ? favorites.map(fav => {
    // Smart category detection - try multiple possible fields
    const getCategory = () => {
      if (fav.business?.type) return fav.business.type;
      return 'General Vendor';
    };

    // Smart location detection - try multiple possible fields
    const getLocation = () => {
      if (fav.business?.location) return fav.business.location;
      return 'Location not specified';
    };

    // Smart image detection - try multiple possible fields
    const getImage = () => {
      console.log('🔍 Debugging image for:', fav.business?.name);
      console.log('🔍 Business ID:', fav.businessId);
      console.log('🔍 Vendor images state:', vendorImages);
      
      // First try to get image from fetched vendor data
      if (vendorImages[fav.businessId]) {
        console.log('✅ Using fetched vendor image:', vendorImages[fav.businessId]);
        return vendorImages[fav.businessId];
      }
      
      // Fallback to business.image if available
      if (fav.business?.image && 
          fav.business.image !== '' && 
          fav.business.image !== '/placeholder.jpg' && 
          fav.business.image !== '/placeholder.svg' &&
          fav.business.image.startsWith('http')) {
        console.log('✅ Using business.image:', fav.business.image);
        return fav.business.image;
      }
      
      // Check if business.image exists and is a relative path
      if (fav.business?.image && 
          fav.business.image !== '' && 
          fav.business.image !== '/placeholder.jpg' && 
          fav.business.image !== '/placeholder.svg' &&
          !fav.business.image.startsWith('http')) {
        console.log('✅ Using business.image (relative):', fav.business.image);
        return fav.business.image;
      }
      
      console.log('⚠️ No valid image found, using placeholder');
      return '/placeholder.jpg';
    };

    const transformed = {
      id: fav.id,
      name: fav.business?.name || 'Unknown Business',
      type: isVenueType(fav.business?.type) ? 'venue' : 'vendor',
      category: getCategory(),
      location: getLocation(),
      rating: fav.business?.rating || 0,
      image: getImage(),
      description: `${getCategory()} • ${getLocation()}`,
      contact: {
        phone: 'Contact vendor for details',
        email: 'Contact vendor for details'
      }
    };
    
    return transformed;
  }) : [];

  // Filter favorites based on selected type
  const filteredFavorites = filterType === 'all' 
    ? transformedFavorites 
    : transformedFavorites.filter(item => item.type === filterType);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Spinner className="w-8 h-8 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-700">Loading your favorites...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error loading favorites</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Your Favorites
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Keep track of your favorite wedding vendors and venues. 
            Click the heart icon on any vendor card to add them here.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' : ''}
          >
            All ({transformedFavorites.length})
          </Button>
          <Button
            variant={filterType === 'vendor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('vendor')}
            className={filterType === 'vendor' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' : ''}
          >
            Vendors ({transformedFavorites.filter(item => item.type === 'vendor').length})
          </Button>
          <Button
            variant={filterType === 'venue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('venue')}
            className={filterType === 'venue' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' : ''}
          >
            Venues ({transformedFavorites.filter(item => item.type === 'venue').length})
          </Button>
        </div>

        {/* Favorites Grid */}
        {filteredFavorites.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No favorites yet</h3>
              <p className="text-neutral-500 mb-6">Start exploring vendors and venues to add them to your favorites</p>
              <Link href="/vendors">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
                  Explore Vendors
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((item) => (
              <Card key={item.id} className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-rose-100 to-pink-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                    {imagesLoading ? (
                      <Spinner className="w-12 h-12 text-rose-300" />
                    ) : item.image && item.image !== '/placeholder.jpg' && item.image !== '/placeholder.svg' && item.image !== '' ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('❌ Image failed to load:', item.image);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-rose-400 text-4xl font-bold ${item.image && item.image !== '/placeholder.jpg' && item.image !== '/placeholder.svg' && item.image !== '' ? 'hidden' : ''}`}>
                      {item.name.charAt(0)}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="absolute top-3 left-3 bg-white/90 text-neutral-700 border-0"
                  >
                    {item.type === 'venue' ? 'Venue' : 'Vendor'}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="absolute top-3 right-3 bg-rose-500 text-white border-0"
                  >
                    {item.category}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-neutral-900 group-hover:text-rose-600 transition-colors duration-200">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-neutral-600">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {item.location}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-neutral-600">({item.rating})</span>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Phone className="w-4 h-4 text-rose-500" />
                      {item.contact.phone}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Mail className="w-4 h-4 text-rose-500" />
                      {item.contact.email}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                      asChild
                    >
                      <Link href={`/${item.type === 'venue' ? 'venues' : 'vendors'}/${Array.isArray(favorites) ? favorites.find(f => f.id === item.id)?.business?.id || item.id : item.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveFavorite(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;