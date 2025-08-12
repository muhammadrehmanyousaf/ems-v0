"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, Package, Eye, Edit, Trash2, RefreshCw } from "lucide-react";
import { getUser } from "@/hooks/getLoggedinUser";

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  downPayment: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  vendorId: number;
  additionalRequests?: string;
  cancellationReason?: string;
  paymentMethod?: string;
  bookingDetails: Array<{
    id: number;
    bookingId: number;
    businessId: number;
    packageId: number;
    menuId?: number;
  }>;
}

const BookingsPage = () => {
  const { user, loading } = getUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  // Fetch user bookings from API
  const fetchUserBookings = async () => {
    try {
      setIsLoading(true);
      
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      const response = await fetch(`http://localhost:3000/api/v1/bookings/simple-user-bookings`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Raw API response:', data);
      
      // Handle different response structures
      let bookingsData: Booking[] = [];
      if (data.data && Array.isArray(data.data)) {
        bookingsData = data.data;
        console.log('Using data.data array:', bookingsData);
      } else if (Array.isArray(data)) {
        bookingsData = data;
        console.log('Using direct array:', bookingsData);
      } else if (data.bookings && Array.isArray(data.bookings)) {
        bookingsData = data.bookings;
        console.log('Using data.bookings array:', bookingsData);
      } else {
        console.log('No valid array found in response');
      }

      // Log first booking to see structure
      if (bookingsData.length > 0) {
        console.log('First booking structure:', bookingsData[0]);
        console.log('Sample date field:', bookingsData[0].bookingDate);
        console.log('Sample time field:', bookingsData[0].bookingTime);
      }

      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh bookings
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserBookings();
    setIsRefreshing(false);
  };

  // Handle booking actions (non-functional for now)
  const handleViewBooking = (booking: Booking) => {
    toast({
      title: "View Booking",
      description: `Viewing details for ${booking.customerName}`,
    });
  };

  const handleEditBooking = (booking: Booking) => {
    toast({
      title: "Edit Booking",
      description: `Edit functionality will be implemented later for ${booking.customerName}`,
    });
  };

  const handleCancelBooking = (booking: Booking) => {
    toast({
      title: "Cancel Booking",
      description: `Cancel functionality will be implemented later for ${booking.customerName}`,
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'completed':
      case 'finished':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 capitalize">{paymentStatus}</Badge>;
    }
  };

  // Format date with proper error handling
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  // Format time with proper error handling
  const formatTime = (timeString: string) => {
    if (!timeString) return 'Time not specified';
    
    try {
      // Handle different time formats
      let time;
      if (timeString.includes('T')) {
        // ISO format like "2024-01-01T14:30:00"
        time = new Date(timeString);
      } else if (timeString.includes(':')) {
        // Time format like "14:30" or "14:30:00"
        time = new Date(`2000-01-01T${timeString}`);
      } else {
        return 'Invalid time format';
      }
      
      if (isNaN(time.getTime())) {
        return 'Invalid time';
      }
      
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Time not available';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Load bookings on component mount
  useEffect(() => {
    if (user && !loading) {
      fetchUserBookings();
    }
  }, [user, loading]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-rose-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
                    {bookings.filter(b => b.status.toLowerCase() === 'confirmed' || b.status.toLowerCase() === 'approved').length}
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
                    {bookings.filter(b => b.status.toLowerCase() === 'pending').length}
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
                    {formatCurrency(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            {isRefreshing ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
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
                              {formatDate(booking.bookingDate)}
                              {formatDate(booking.bookingDate) === 'Invalid date' && (
                                <span className="text-xs text-red-500 ml-1">({booking.bookingDate})</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(booking.bookingTime)}
                              {formatTime(booking.bookingTime) === 'Invalid time' && (
                                <span className="text-xs text-red-500 ml-1">({booking.bookingTime})</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {booking.customerEmail}
                            </span>
                          </div>
                        </div>
                                                 <div className="text-right">
                           <div className="space-y-2">
                             {getStatusBadge(booking.status)}
                           </div>
                           <p className="text-lg font-bold text-rose-600 mt-2">
                             {formatCurrency(booking.totalAmount)}
                           </p>
                           {booking.downPayment > 0 && (
                             <p className="text-sm text-blue-600">
                               Down Payment: {formatCurrency(booking.downPayment)}
                             </p>
                           )}
                         </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <User className="w-4 h-4" />
                          <span>Phone: {booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Package className="w-4 h-4" />
                          <span>Vendor ID: {booking.vendorId}</span>
                        </div>
                        {booking.additionalRequests && (
                          <div className="flex items-center gap-2 text-neutral-600 md:col-span-2">
                            <Calendar className="w-4 h-4" />
                            <span>Requests: {booking.additionalRequests}</span>
                          </div>
                        )}
                        {booking.cancellationReason && (
                          <div className="flex items-center gap-2 text-neutral-600 md:col-span-2">
                            <Calendar className="w-4 h-4" />
                            <span>Cancellation: {booking.cancellationReason}</span>
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
                        onClick={() => handleViewBooking(booking)}
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
                        disabled={booking.status.toLowerCase() === 'cancelled' || booking.status.toLowerCase() === 'completed'}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(booking)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={booking.status.toLowerCase() === 'cancelled' || booking.status.toLowerCase() === 'completed'}
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
