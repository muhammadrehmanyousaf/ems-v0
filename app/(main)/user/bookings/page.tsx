"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, Phone, Mail, Star, Eye, Trash2, Edit, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingDetail {
  id: number;
  bookingId: number;
  businessId: number;
  packageId: number;
  menuId: number | null;
  totalAmount: number;
  downPayment: number;
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: number;
    name: string;
    city: string;
    subArea: string;
    description: string;
    services: string;
  };
  package: {
    id: number;
    name: string;
    price: number;
    features: string[];
  };
  menu: {
    id: number;
    title: string;
    price: number;
    data: any;
  } | null;
}

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorId: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  downPayment: number;
  additionalRequests: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  bookingDetails: BookingDetail[];
}

const BookingsPage = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  // Fetch bookings on component mount
  useEffect(() => {
    if (user && !isLoading) {
      fetchBookings();
    } else if (!isLoading && !user) {
      setIsLoadingBookings(false);
    }
  }, [user, isLoading]);

  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true);

      if (!user || !user.id) {
        throw new Error('User ID not found');
      }
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
      const bookingsData = res.data?.data || [];
      setBookings(bookingsData);

      try {
        localStorage.setItem('user_bookings', JSON.stringify(bookingsData));
      } catch {
        // localStorage quota exceeded
      }
    } catch (error) {
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
    router.push(`/user/bookings/${booking.id}`);
  };

  const handleEditBooking = (booking: Booking) => {
    router.push(`/user/bookings/${booking.id}`);
  };

  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      setIsCancelling(true);
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${bookingToCancel.id}`, { status: 'cancelled' });
      toast({
        title: "Booking Cancelled",
        description: `Booking #${bookingToCancel.id} has been cancelled successfully.`,
      });
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    }
  };

  if (isLoading || isLoadingBookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="h-9 w-52 skeleton-shimmer rounded-lg mx-auto mb-3" />
            <div className="h-4 w-72 skeleton-shimmer rounded mx-auto" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-20 skeleton-shimmer rounded mb-2" />
                      <div className="h-7 w-12 skeleton-shimmer rounded" />
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 skeleton-shimmer rounded-full flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action bar skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="h-4 w-40 skeleton-shimmer rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-28 skeleton-shimmer rounded-lg" />
              <div className="h-9 w-28 skeleton-shimmer rounded-lg" />
            </div>
          </div>

          {/* Booking cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  {/* Card header stripe */}
                  <div className="h-2 skeleton-shimmer" />
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Title row */}
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-28 skeleton-shimmer rounded" />
                      <div className="h-6 w-20 skeleton-shimmer rounded-full" />
                    </div>
                    {/* Info rows */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 skeleton-shimmer rounded" />
                        <div className="h-4 w-36 skeleton-shimmer rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 skeleton-shimmer rounded" />
                        <div className="h-4 w-28 skeleton-shimmer rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 skeleton-shimmer rounded" />
                        <div className="h-4 w-32 skeleton-shimmer rounded" />
                      </div>
                    </div>
                    {/* Divider */}
                    <div className="h-px bg-gray-100" />
                    {/* Actions row */}
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 skeleton-shimmer rounded" />
                      <div className="flex gap-2">
                        <div className="h-8 w-16 skeleton-shimmer rounded-lg" />
                        <div className="h-8 w-16 skeleton-shimmer rounded-lg" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <p className="text-neutral-600 text-sm sm:text-base">Please log in to view your bookings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
            My Bookings
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-600 px-2">
            Manage and track all your event bookings
          </p>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Total Bookings</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900">{bookings.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Confirmed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Total Spent</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                    Rs. {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">Recent Bookings</h2>
            <p className="text-xs sm:text-sm text-neutral-600">Your latest event bookings and reservations</p>
          </div>
          <Button
            onClick={fetchBookings}
            disabled={isLoadingBookings}
            variant="outline"
            size="sm"
            className="border-purple-200 text-purple-600 hover:bg-purple-50 self-center sm:self-auto min-h-[44px] px-4"
          >
            {isLoadingBookings ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>

        {/* Bookings List - Mobile Optimized */}
        {bookings.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">No Bookings Yet</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-6 px-4">You haven't made any bookings yet. Start planning your perfect event!</p>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white min-h-[44px] px-6">
                Browse Venues & Vendors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Booking Header - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 leading-tight">
                          {booking.customerName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{formatDate(booking.bookingDate)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{formatTime(booking.bookingTime)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{booking.customerEmail}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`capitalize text-xs sm:text-sm ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                        <p className="text-base sm:text-lg font-bold text-purple-600">
                          Rs. {booking.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Additional Details - Mobile Optimized */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Phone: {booking.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {booking.bookingDetails?.[0]?.business?.city || 'N/A'}, {booking.bookingDetails?.[0]?.business?.subArea || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 sm:col-span-2">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Vendor: {booking.bookingDetails?.[0]?.business?.name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Payment: {booking.paymentStatus}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Down Payment: {booking.downPayment}%
                        </span>
                      </div>
                      {booking.additionalRequests && (
                        <div className="flex items-start gap-2 text-neutral-600 sm:col-span-2">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm">Requirements: {booking.additionalRequests}</span>
                        </div>
                      )}
                      {booking.bookingDetails && booking.bookingDetails.length > 0 && (
                        <div className="flex items-center gap-2 text-neutral-600 sm:col-span-2">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">
                            Packages: {booking.bookingDetails.map(detail => detail.package?.name || 'N/A').join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Vendor Details Section - Mobile Optimized */}
                    {booking.bookingDetails && booking.bookingDetails.length > 1 && (
                      <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-neutral-900 mb-3 text-sm sm:text-base">Vendors & Services:</h4>
                        <div className="space-y-3">
                          {booking.bookingDetails.map((detail, index) => (
                            <div key={detail.id} className="border-l-4 border-purple-200 pl-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-neutral-900 text-sm sm:text-base truncate">
                                    {detail.business?.name || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-neutral-600 truncate">
                                    {detail.business?.city || 'N/A'}, {detail.business?.subArea || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-neutral-600 truncate">
                                    {detail.package?.name || 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-purple-600 text-sm sm:text-base">
                                    Rs. {detail.totalAmount?.toLocaleString() || '0'}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    Down Payment: {detail.downPayment || 0}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking Date */}
                    <p className="text-xs text-neutral-500">
                      Booked on {formatDate(booking.createdAt)}
                    </p>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-100">
                      <Button
                        onClick={() => handleViewDetails(booking)}
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 min-h-[44px] text-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleEditBooking(booking)}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50 min-h-[44px] text-sm"
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleCancelClick(booking)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] text-sm"
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

        {/* Additional Info - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-xs sm:text-sm text-neutral-500">
            Need help with your bookings? Contact our support team for assistance
          </p>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel{" "}
              <span className="font-semibold text-neutral-900">
                Booking #{bookingToCancel?.id}
              </span>
              ? This action cannot be undone. Any payments made may be subject to the refund policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingsPage;
