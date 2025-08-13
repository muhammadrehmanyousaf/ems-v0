"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, Phone, Mail, Star, Eye, Trash2, Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

interface Booking {
  id: string;
  userId: string;
  vendorId: string;
  vendorName: string;
  vendorType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequirements?: string;
  packageDetails?: string;
}

const BookingsPage = () => {
  console.log('🔍 BookingsPage - Component rendered!');
  
  const { user, isAuthenticated, isLoading } = useUser();
  
  // Debug logging
  console.log('🔍 BookingsPage - Auth state:', { user: !!user, isAuthenticated, isLoading });
  console.log('🔍 BookingsPage - User data:', user);
  
  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || '';
  };
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  // Fetch bookings on component mount
  useEffect(() => {
    console.log('🔍 BookingsPage - useEffect triggered:', { user: !!user, isLoading });
    if (user && !isLoading) {
      console.log('🔍 BookingsPage - Loading user bookings...');
      fetchBookings();
    } else if (!isLoading && !user) {
      console.log('🔍 BookingsPage - No user found, stopping loading');
      setIsLoadingBookings(false);
    }
  }, [user, isLoading]);

  const fetchBookings = async () => {
    try {
      console.log('🔍 BookingsPage - fetchBookings called');
      setIsLoadingBookings(true);
      
      if (!user || !user.id) {
        console.log('🔍 BookingsPage - No user ID found');
        throw new Error('User ID not found');
      }

      console.log('🔍 BookingsPage - Fetching bookings for user:', user.id);
      const response = await fetch(`http://localhost:3000/api/v1/bookings?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 BookingsPage - Bookings data received:', data);
        setBookings(data.data || []);
      } else {
        console.error('🔍 BookingsPage - Failed to fetch bookings:', response.status);
        setBookings([]);
      }
    } catch (error) {
      console.error('🔍 BookingsPage - Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleEditBooking = (booking: Booking) => {
    // Navigate to booking edit page
    router.push(`/booking/${booking.id}/edit`);
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        });
        fetchBookings(); // Refresh the list
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || isLoadingBookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-rose-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Please log in to view your bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Bookings</h1>
          <p className="text-lg text-neutral-600">Manage and track all your event bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-neutral-900">{bookings.length}</p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {/* Assuming totalAmount is the correct field for total spent */}
                    {bookings.reduce((sum, b) => sum + b.totalAmount, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Recent Bookings</h2>
            <p className="text-sm text-neutral-600">Your latest event bookings and reservations</p>
          </div>
          <Button
            onClick={fetchBookings}
            disabled={isLoadingBookings}
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            {isLoadingBookings ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Bookings Yet</h3>
              <p className="text-neutral-600 mb-6">You haven't made any bookings yet. Start planning your perfect event!</p>
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
                Browse Venues & Vendors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-neutral-900 mb-1">{booking.customerName}</h3>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(booking.eventDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(booking.eventTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {booking.customerEmail}
                            </span>
                          </div>
                        </div>
                                                 <div className="text-right">
                           <div className="space-y-2">
                             <Badge className={`capitalize ${getStatusColor(booking.status)}`}>
                               {booking.status}
                             </Badge>
                           </div>
                           <p className="text-lg font-bold text-rose-600 mt-2">
                             {booking.totalAmount}
                           </p>
                         </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <User className="w-4 h-4" />
                          <span>Phone: {booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <MapPin className="w-4 h-4" />
                          <span>Location: {booking.location}</span>
                        </div>
                        {booking.specialRequirements && (
                          <div className="flex items-center gap-2 text-neutral-600 md:col-span-2">
                            <Eye className="w-4 h-4" />
                            <span>Requirements: {booking.specialRequirements}</span>
                          </div>
                        )}
                        {booking.packageDetails && (
                          <div className="flex items-center gap-2 text-neutral-600 md:col-span-2">
                            <Star className="w-4 h-4" />
                            <span>Package: {booking.packageDetails}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500">
                        Booked on {formatDate(booking.createdAt)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                      <Button
                        onClick={() => handleViewDetails(booking)}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleEditBooking(booking)}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(booking)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}



        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Need help with your bookings? Contact our support team for assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
