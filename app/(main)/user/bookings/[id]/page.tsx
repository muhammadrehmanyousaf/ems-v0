"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Star, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CreditCard, 
  Package, 
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Printer
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";

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

const BookingDetailPage = () => {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch booking details
  useEffect(() => {
    if (user && !isLoading && bookingId) {
      fetchBookingDetails();
    } else if (!isLoading && !user) {
      setIsLoadingBooking(false);
    }
  }, [user, isLoading, bookingId]);

    const fetchBookingDetails = async () => {
    try {
      setIsLoadingBooking(true);
      
      if (!user || !user.id) {
        throw new Error('User ID not found');
      }

      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
      const allBookings = res.data?.data || [];

      const foundBooking = allBookings.find((b: Booking) => b.id.toString() === bookingId);

      if (foundBooking) {
        if (!foundBooking.bookingDetails) {
          foundBooking.bookingDetails = [];
        }
        setBooking(foundBooking);
      } else {
        // Fallback to localStorage cache
        try {
          const storedBookings = localStorage.getItem('user_bookings');
          if (storedBookings) {
            const parsedBookings = JSON.parse(storedBookings);
            const storedBooking = parsedBookings.find((b: Booking) => b.id.toString() === bookingId);
            if (storedBooking) {
              setBooking(storedBooking);
              return;
            }
          }
        } catch {
          // localStorage read failed
        }
        throw new Error('Booking not found');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBooking(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
      default:
        return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />;
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

  const handleEditBooking = () => {
    if (booking) {
      router.push(`/user/bookings/${booking.id}`);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    try {
      setIsUpdating(true);
      await axiosInstance.patch(`${BACKEND_URL}api/v1/bookings/${booking.id}`, { status: 'cancelled' });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      fetchBookingDetails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || isLoadingBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <Spinner size="lg" className="text-purple-500 mx-auto mb-4" />
          <p className="text-neutral-600 text-sm sm:text-base">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <p className="text-neutral-600 text-sm sm:text-base">Please log in to view booking details</p>
        </div>
      </div>
    );
  }

     if (!booking || !booking.id) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center px-4">
         <div className="text-center max-w-sm mx-auto">
           <p className="text-neutral-600 text-sm sm:text-base mb-4">Booking not found</p>
           <Button 
             onClick={() => router.push('/user/bookings')}
             className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white min-h-[44px] px-6"
           >
             Back to Bookings
           </Button>
         </div>
       </div>
     );
   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={() => router.push('/user/bookings')}
            variant="ghost"
            className="mb-4 text-neutral-600 hover:text-neutral-900 min-h-[44px] px-3 sm:px-4"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">Back to Bookings</span>
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
                Booking Details
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-neutral-600">Booking #{booking.id}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Badge className={`capitalize text-xs sm:text-sm px-3 py-2 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="ml-2">{booking.status}</span>
              </Badge>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleEditBooking}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-green-200 text-green-600 hover:bg-green-50 min-h-[44px] text-sm"
                  disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                
                <Button
                  onClick={handleCancelBooking}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] text-sm"
                  disabled={booking.status === 'cancelled' || booking.status === 'completed' || isUpdating}
                >
                  {isUpdating ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Event Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-neutral-600">Event Date</p>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{formatDate(booking.bookingDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-neutral-600">Event Time</p>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">{formatTime(booking.bookingTime)}</p>
                    </div>
                  </div>
                </div>
                
                {booking.additionalRequests && booking.additionalRequests.trim() !== '' && (
                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-xs sm:text-sm text-neutral-600 mb-2">Special Requirements</p>
                    <p className="text-neutral-900 bg-neutral-50 p-3 rounded-lg text-sm sm:text-base">
                      {booking.additionalRequests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="w-5 h-5 text-purple-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-neutral-600">Name</p>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{booking.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-neutral-600">Email</p>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base truncate">{booking.customerEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Phone className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-neutral-600">Phone</p>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">{booking.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendors & Services */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Vendors & Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {booking.bookingDetails && booking.bookingDetails.length > 0 ? (
                    booking.bookingDetails.map((detail, index) => (
                      <div key={detail.id} className="border border-neutral-200 rounded-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 text-base sm:text-lg mb-2 leading-tight">
                              {detail.business.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600 mb-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{detail.business.city}, {detail.business.subArea}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-600">{detail.business.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-purple-600">
                              Rs. {detail.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-500">
                              Down Payment: {detail.downPayment}%
                            </p>
                          </div>
                        </div>
                        
                        {/* Package Details */}
                        <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-purple-600" />
                            <h5 className="font-semibold text-neutral-900 text-sm sm:text-base">{detail.package.name}</h5>
                          </div>
                          
                          {detail.package.features && detail.package.features.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs sm:text-sm font-medium text-neutral-700">Package Features:</p>
                              <ul className="space-y-1">
                                {detail.package.features.map((feature, featureIndex) => (
                                  <li key={featureIndex} className="text-xs sm:text-sm text-neutral-600 flex items-start gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="flex-1">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {/* Menu Details (if applicable) */}
                        {detail.menu && (
                          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <h5 className="font-semibold text-neutral-900 text-sm sm:text-base">{detail.menu.title}</h5>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-600">
                              Menu Price: Rs. {detail.menu.price.toLocaleString()}
                            </p>
                          </div>
                        )}
                        
                        {/* Special Requests */}
                        {detail.specialRequests && (
                          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4 text-yellow-600" />
                              <h5 className="font-semibold text-neutral-900 text-sm sm:text-base">Special Requests</h5>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-700">{detail.specialRequests}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-600 text-sm sm:text-base">No booking details available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-neutral-600">Total Amount:</span>
                    <span className="font-semibold text-neutral-900 text-sm sm:text-base">
                      Rs. {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-neutral-600">Down Payment:</span>
                    <span className="font-semibold text-neutral-900 text-sm sm:text-base">
                      {booking.downPayment}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-neutral-600">Payment Status:</span>
                    <Badge className={`capitalize text-xs ${getStatusColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  
                  {booking.paymentMethod && booking.paymentMethod.trim() !== '' && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-neutral-600">Payment Method:</span>
                      <span className="font-semibold text-neutral-900 text-sm sm:text-base truncate">
                        {booking.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold text-neutral-900">Amount Due:</span>
                    <span className="text-lg sm:text-xl font-bold text-purple-600">
                      Rs. {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Booking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">Booking Created</p>
                      <p className="text-xs sm:text-sm text-neutral-600">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">Last Updated</p>
                      <p className="text-xs sm:text-sm text-neutral-600">{formatDate(booking.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {booking.cancellationReason && booking.cancellationReason.trim() !== '' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 text-sm sm:text-base">Cancellation Reason</p>
                        <p className="text-xs sm:text-sm text-neutral-600">{booking.cancellationReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/contact')}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 min-h-[44px] text-sm"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                
                <Button
                  onClick={() => router.push('/help')}
                  variant="outline"
                  className="w-full border-green-200 text-green-600 hover:bg-green-50 min-h-[44px] text-sm"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Get Help
                </Button>
                
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full border-neutral-200 text-neutral-600 hover:bg-neutral-50 min-h-[44px] text-sm"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
