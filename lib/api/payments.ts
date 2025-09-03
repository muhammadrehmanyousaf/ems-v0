import axiosInstance from '../axiosConfig';
import { BACKEND_URL } from '../backend-url';
import type { 
  PaymentResponse, 
  PaymentProcessingResponse, 
  PaymentHistory, 
  PendingPayment 
} from '../types';

export class PaymentAPI {
  // Create payment intent
  static async createPaymentIntent(
    bookingId: number,
    customerEmail: string,
    paymentType: 'down_payment' | 'remaining_payment' | 'full_payment'
  ): Promise<PaymentResponse> {
    try {
      console.log('🔍 PaymentAPI: Creating payment intent with:', {
        bookingId,
        customerEmail,
        paymentType,
        paymentTypeDetails: {
          isDownPayment: paymentType === 'down_payment',
          isRemainingPayment: paymentType === 'remaining_payment',
          isFullPayment: paymentType === 'full_payment'
        },
        endpoint: `${BACKEND_URL}api/v1/payments/create-payment-intent`
      });
      
      const requestBody = {
        bookingId: Number(bookingId), // Ensure bookingId is a number
        customerEmail,
        paymentType
      };
      
      console.log('🔍 PaymentAPI: Request body being sent:', requestBody);
      
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/create-payment-intent`, requestBody);
      
      console.log('🔍 PaymentAPI: Payment intent response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔍 PaymentAPI: Error creating payment intent:', error);
      console.error('🔍 PaymentAPI: Error response:', error.response?.data);
      
      // Better error message handling
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create payment intent';
      
      throw new Error(errorMessage);
    }
  }

  // Process down payment
  static async processDownPayment(bookingId: number): Promise<PaymentProcessingResponse> {
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/process-down-payment`, {
        bookingId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to process down payment');
    }
  }

  // Process remaining payment
  static async processRemainingPayment(bookingId: number): Promise<PaymentProcessingResponse> {
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/process-remaining-payment`, {
        bookingId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to process remaining payment');
    }
  }

  // Process full payment
  static async processFullPayment(bookingId: number): Promise<PaymentProcessingResponse> {
    try {
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/process-full-payment`, {
        bookingId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to process full payment');
    }
  }

  // Get payment history
  static async getPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      // TODO: Replace with your actual payment history endpoint
      console.log('🔍 PaymentAPI: Fetching payment history...');
      
      // For now, return empty array until we know your real endpoint
      return [];
      
      // When you provide the real endpoint, uncomment this:
      // const response = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/history`);
      // return response.data.data || [];
    } catch (error: any) {
      console.error('🔍 PaymentAPI: Error fetching payment history:', error);
      return [];
    }
  }

  // Get pending payments
  static async getPendingPayments(): Promise<PendingPayment[]> {
    try {
      // TODO: Replace with your actual pending payments endpoint
      console.log('🔍 PaymentAPI: Fetching pending payments...');
      
      // For now, return empty array until we know your real endpoint
      return [];
      
      // When you provide the real endpoint, uncomment this:
      // const response = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/pending`);
      // return response.data.data || [];
    } catch (error: any) {
      console.error('🔍 PaymentAPI: Error fetching pending payments:', error);
      return [];
    }
  }

  // Get booking payment status
  static async getBookingPaymentStatus(bookingId: number): Promise<{
    status: string;
    paymentStatus: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }> {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/${bookingId}/payment-status`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch booking payment status');
    }
  }

  // Verify booking exists before creating payment intent
  static async verifyBookingExists(bookingId: number): Promise<boolean> {
    try {
      console.log('🔍 PaymentAPI: Verifying booking exists:', bookingId);
      // 1) Primary check: direct booking lookup
      try {
        const resp = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/${bookingId}`);
        console.log('🔍 PaymentAPI: Booking verification response (direct):', resp.data);
        // Consider HTTP 200 as success even if payload shape differs
        if (resp.status === 200) {
          const data = resp.data;
          // Return true if common success shapes match
          if (data?.status === true || data?.data?.id === bookingId || data?.data?.bookingId === bookingId) {
            return true;
          }
          // Some backends return a generic object/message but 200 means the resource exists
          return true;
        }
      } catch (err: any) {
        // If 404, we will try fallback; otherwise log and continue
        const status = err?.response?.status;
        console.warn('🔍 PaymentAPI: Direct booking lookup failed with status:', status);
        if (status === 404) {
          // proceed to fallback check
        } else {
          // proceed to fallback anyway
        }
      }

      // 2) Fallback: fetch the user's bookings list and see if the id appears
      try {
        const listResp = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
        const list = listResp?.data?.data || [];
        console.log('🔍 PaymentAPI: Fallback bookings list count:', Array.isArray(list) ? list.length : 0);
        const found = Array.isArray(list) && list.some((b: any) => Number(b?.id) === Number(bookingId));
        console.log('🔍 PaymentAPI: Fallback booking id present:', found);
        return !!found;
      } catch (listErr) {
        console.error('🔍 PaymentAPI: Fallback bookings list lookup failed:', listErr);
      }

      // If neither check confirms existence, return false
      return false;
    } catch (error: any) {
      console.error('🔍 PaymentAPI: Booking verification unexpected error:', error);
      return false;
    }
  }

  // Get user bookings for payments page
  static async getUserBookings(): Promise<{
    pendingPayments: PendingPayment[];
    paymentHistory: PaymentHistory[];
  }> {
    try {
      console.log('🔍 PaymentAPI: Fetching user bookings for payments...');
      
      // Use the same API endpoint as the bookings page
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
      console.log('🔍 PaymentAPI: User bookings response:', response.data);
      
      const bookings = response.data.data || [];
      console.log('🔍 PaymentAPI: Raw bookings data:', bookings);
      
      // Log first few bookings to see structure
      if (bookings.length > 0) {
        console.log('🔍 PaymentAPI: First booking structure:', {
          id: bookings[0].id,
          status: bookings[0].status,
          paymentStatus: bookings[0].paymentStatus,
          totalAmount: bookings[0].totalAmount,
          downPayment: bookings[0].downPayment,
          customerName: bookings[0].customerName
        });
      }
      
      // Organize bookings by payment status
      const pendingPayments: PendingPayment[] = [];
      const paymentHistory: PaymentHistory[] = [];
      
      bookings.forEach((booking: any, index: number) => {
        console.log(`🔍 PaymentAPI: Processing booking ${index + 1}:`, {
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
          downPayment: booking.downPayment
        });
        
        // Extract business info from bookingDetails
        const businesses = booking.bookingDetails?.map((detail: any) => ({
          id: detail.businessId,
          name: detail.business?.name || 'Business'
        })) || [{
          id: booking.vendorId,
          name: 'Business'
        }];
        
              // Use the payment type from the backend if available, otherwise determine it
              // Use the payment type and amount from the backend if available
        const determinedPaymentType = booking.paymentType || this.determinePaymentType(booking.status, booking.paymentStatus);
        
        // For full payments, use the total amount; for others, calculate based on status
        let calculatedAmount: number;
        if (determinedPaymentType === 'full_payment') {
          calculatedAmount = booking.totalAmount;
        } else {
          calculatedAmount = this.calculatePaymentAmount(booking.status, booking.paymentStatus, booking.totalAmount, booking.downPayment);
        }
        
        console.log(`🔍 PaymentAPI: Payment type determination for booking ${index + 1}:`, {
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          determinedPaymentType,
          calculatedAmount,
          totalAmount: booking.totalAmount,
          downPayment: booking.downPayment
        });
        
        const paymentData = {
          id: booking.id,
          bookingId: booking.id,
          customerName: booking.customerName || 'Customer',
          bookingDate: booking.bookingDate,
          businesses,
          paymentType: determinedPaymentType,
          amount: calculatedAmount,
          currency: 'usd', // Default currency
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
          totalAmount: booking.totalAmount
        };
        
        console.log(`🔍 PaymentAPI: Payment data for booking ${index + 1}:`, paymentData);
        
        // Treat any completed booking as done (history), regardless of paymentStatus
        const statusLower = String(booking.status || '').toLowerCase();
        const paymentLower = String(booking.paymentStatus || '').toLowerCase();
        if (statusLower === 'completed' || paymentLower === 'paid' || paymentLower === 'completed') {
          console.log(`🔍 PaymentAPI: Adding to payment history:`, paymentData);
          paymentHistory.push({
            ...paymentData,
            status: 'completed',
            updatedAt: paymentData.createdAt,
            bookingDetails: {
              customerName: paymentData.customerName,
              bookingDate: paymentData.bookingDate,
              businesses: paymentData.businesses
            }
          });
        } else {
          console.log(`🔍 PaymentAPI: Adding to pending payments:`, paymentData);
          pendingPayments.push(paymentData);
        }
      });
      
      console.log('🔍 PaymentAPI: Final organized payments:', { 
        pendingPayments: pendingPayments.length, 
        paymentHistory: paymentHistory.length,
        totalBookings: bookings.length
      });
      
      return { pendingPayments, paymentHistory };
    } catch (error: any) {
      console.error('🔍 PaymentAPI: Error fetching user bookings:', error);
      return { pendingPayments: [], paymentHistory: [] };
    }
  }
  
  // Determine payment type based on booking and payment status (case-insensitive)
  private static determinePaymentType(bookingStatus: string, paymentStatus: string): 'down_payment' | 'remaining_payment' | 'full_payment' {
    const status = bookingStatus?.toLowerCase();
    const payment = paymentStatus?.toLowerCase();
    
    // If booking is completed, treat as full payment regardless of payment status
    if (status === 'completed') {
      return 'full_payment';
    }
    
    if (payment === 'pending' && status === 'pending') {
      // Check if this should be a full payment or down payment
      // For now, we'll treat pending/pending as down_payment by default
      // The backend can determine if it should be full_payment based on business logic
      return 'down_payment';
    } else if (payment === 'partial' && status === 'confirmed') {
      return 'remaining_payment';
    } else if (payment === 'paid' && status === 'completed') {
      return 'full_payment'; // For completed bookings
    } else {
      return 'down_payment'; // fallback
    }
  }
  
  // Calculate payment amount based on status and downPayment field (case-insensitive)
  private static calculatePaymentAmount(bookingStatus: string, paymentStatus: string, totalAmount: number, downPayment: number): number {
    const status = bookingStatus?.toLowerCase();
    const payment = paymentStatus?.toLowerCase();
    
    if (payment === 'pending' && status === 'pending') {
      // For pending payments, we need to check if it's a full payment or down payment
      // The backend should determine this, but for now we'll use down payment logic
      return downPayment || Math.round(totalAmount * 0.2);
    } else if (payment === 'partial' && status === 'confirmed') {
      // Remaining amount = total - downPayment
      return totalAmount - (downPayment || Math.round(totalAmount * 0.2));
    } else if (payment === 'paid' && status === 'completed') {
      // Completed booking - show total amount
      return totalAmount;
    } else {
      return totalAmount;
    }
  }
}
