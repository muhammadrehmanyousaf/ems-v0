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
  Info
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Cookies from "js-cookie";

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

  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || Cookies.get('auth_token') || '';
    }
    return '';
  };

  // Fetch booking details
  useEffect(() => {
    console.log('🔍 BookingDetailPage - useEffect triggered:', { user: !!user, isLoading, bookingId });
    if (user && !isLoading && bookingId) {
      console.log('🔍 BookingDetailPage - Fetching booking details for ID:', bookingId);
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

      // First try to get all bookings and find the specific one
      const response = await fetch(`http://localhost:3000/api/v1/bookings/simple-user-bookings`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allBookings = data.data || [];
        
        console.log('🔍 BookingDetailPage - All bookings received:', allBookings.length);
        console.log('🔍 BookingDetailPage - Looking for booking ID:', bookingId);
        console.log('🔍 BookingDetailPage - Available booking IDs:', allBookings.map((b: Booking) => b.id));
        
        // Find the specific booking by ID
        const foundBooking = allBookings.find((booking: Booking) => booking.id.toString() === bookingId);
        
        if (foundBooking) {
          console.log('🔍 BookingDetailPage - Found booking:', foundBooking);
          // Ensure bookingDetails is always an array
          if (!foundBooking.bookingDetails) {
            foundBooking.bookingDetails = [];
          }
          
          setBooking(foundBooking);
        } else {
          console.log('🔍 BookingDetailPage - Booking not found in list');
          
          // Try to get booking from localStorage as fallback
          try {
            const storedBookings = localStorage.getItem('user_bookings');
            if (storedBookings) {
              const parsedBookings = JSON.parse(storedBookings);
              const storedBooking = parsedBookings.find((b: Booking) => b.id.toString() === bookingId);
              if (storedBooking) {
                console.log('🔍 BookingDetailPage - Found booking in localStorage');
                setBooking(storedBooking);
                return;
              }
            }
          } catch (error) {
            console.log('🔍 BookingDetailPage - Error reading from localStorage:', error);
          }
          
          throw new Error('Booking not found');
        }
      } else {
        throw new Error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
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
      router.push(`/booking/${booking.id}/edit`);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    try {
      setIsUpdating(true);
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
        fetchBookingDetails(); // Refresh the data
      } else {
        throw new Error('Failed to cancel booking');
      }
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-rose-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Please log in to view booking details</p>
        </div>
      </div>
    );
  }

     if (!booking || !booking.id) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
         <div className="text-center">
           <p className="text-neutral-600">Booking not found</p>
           <Button 
             onClick={() => router.push('/user/bookings')}
             className="mt-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
           >
             Back to Bookings
           </Button>
         </div>
       </div>
     );
   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/user/bookings')}
            variant="ghost"
            className="mb-4 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Booking Details</h1>
              <p className="text-lg text-neutral-600">Booking #{booking.id}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={`capitalize text-sm px-3 py-1 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="ml-2">{booking.status}</span>
              </Badge>
              
              <Button
                onClick={handleEditBooking}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-600 hover:bg-green-50"
                disabled={booking.status === 'cancelled' || booking.status === 'completed'}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Button
                onClick={handleCancelBooking}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={booking.status === 'cancelled' || booking.status === 'completed' || isUpdating}
              >
                {isUpdating ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-sm text-neutral-600">Event Date</p>
                      <p className="font-semibold text-neutral-900">{formatDate(booking.bookingDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-sm text-neutral-600">Event Time</p>
                      <p className="font-semibold text-neutral-900">{formatTime(booking.bookingTime)}</p>
                    </div>
                  </div>
                </div>
                
                                 {booking.additionalRequests && booking.additionalRequests.trim() !== '' && (
                   <div className="pt-4 border-t border-neutral-200">
                     <p className="text-sm text-neutral-600 mb-2">Special Requirements</p>
                     <p className="text-neutral-900 bg-neutral-50 p-3 rounded-lg">
                       {booking.additionalRequests}
                     </p>
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-rose-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-sm text-neutral-600">Name</p>
                      <p className="font-semibold text-neutral-900">{booking.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-sm text-neutral-600">Email</p>
                      <p className="font-semibold text-neutral-900">{booking.customerEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-sm text-neutral-600">Phone</p>
                      <p className="font-semibold text-neutral-900">{booking.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendors & Services */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-600" />
                  Vendors & Services
                </CardTitle>
              </CardHeader>
                             <CardContent>
                 <div className="space-y-6">
                   {booking.bookingDetails && booking.bookingDetails.length > 0 ? (
                     booking.bookingDetails.map((detail, index) => (
                    <div key={detail.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-900 text-lg mb-1">
                            {detail.business.name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{detail.business.city}, {detail.business.subArea}</span>
                          </div>
                          <p className="text-sm text-neutral-600">{detail.business.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-rose-600">
                            Rs. {detail.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-sm text-neutral-500">
                            Down Payment: {detail.downPayment}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Package Details */}
                      <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-4 h-4 text-rose-600" />
                          <h5 className="font-semibold text-neutral-900">{detail.package.name}</h5>
                        </div>
                        
                        {detail.package.features && detail.package.features.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700">Package Features:</p>
                            <ul className="space-y-1">
                              {detail.package.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="text-sm text-neutral-600 flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Menu Details (if applicable) */}
                      {detail.menu && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <h5 className="font-semibold text-neutral-900">{detail.menu.title}</h5>
                          </div>
                          <p className="text-sm text-neutral-600">
                            Menu Price: Rs. {detail.menu.price.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {/* Special Requests */}
                      {detail.specialRequests && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-yellow-600" />
                            <h5 className="font-semibold text-neutral-900">Special Requests</h5>
                          </div>
                          <p className="text-sm text-neutral-700">{detail.specialRequests}</p>
                        </div>
                                             )}
                     </div>
                   ))
                   ) : (
                     <div className="text-center py-8">
                       <p className="text-neutral-600">No booking details available</p>
                     </div>
                   )}
                 </div>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-rose-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total Amount:</span>
                    <span className="font-semibold text-neutral-900">
                      Rs. {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Down Payment:</span>
                    <span className="font-semibold text-neutral-900">
                      {booking.downPayment}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Payment Status:</span>
                    <Badge className={`capitalize ${getStatusColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  
                                     {booking.paymentMethod && booking.paymentMethod.trim() !== '' && (
                     <div className="flex justify-between items-center">
                       <span className="text-neutral-600">Payment Method:</span>
                       <span className="font-semibold text-neutral-900">
                         {booking.paymentMethod}
                       </span>
                     </div>
                   )}
                </div>
                
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-neutral-900">Amount Due:</span>
                    <span className="text-xl font-bold text-rose-600">
                      Rs. {booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  Booking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-neutral-900">Booking Created</p>
                      <p className="text-sm text-neutral-600">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-neutral-900">Last Updated</p>
                      <p className="text-sm text-neutral-600">{formatDate(booking.updatedAt)}</p>
                    </div>
                  </div>
                  
                                     {booking.cancellationReason && booking.cancellationReason.trim() !== '' && (
                     <div className="flex items-start gap-3">
                       <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                       <div>
                         <p className="font-semibold text-neutral-900">Cancellation Reason</p>
                         <p className="text-sm text-neutral-600">{booking.cancellationReason}</p>
                       </div>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/contact')}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Contact Support
                </Button>
                
                <Button
                  onClick={() => router.push('/help')}
                  variant="outline"
                  className="w-full border-green-200 text-green-600 hover:bg-green-50"
                >
                  Get Help
                </Button>
                
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
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
