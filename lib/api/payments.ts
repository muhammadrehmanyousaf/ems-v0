import axiosInstance from '../axiosConfig';
import { BACKEND_URL } from '../backend-url';
import type {
  PaymentResponse,
  PaymentProcessingResponse,
  PaymentHistory,
  PendingPayment
} from '../types';
import { isSettled } from '../payment-status';

export class PaymentAPI {
  /**
   * WW-DIRECT-PAY — the Stripe surface of this client is gone.
   *
   * `getStripeConfig` (the publishable key), `createCheckoutSession` and
   * `verifyCheckoutSession` were removed with the last components that called
   * them. Stripe cannot onboard Pakistani businesses, so none of it could ever
   * have moved money to a venue on this platform; customers pay each venue
   * directly and report the transfer, and the vendor confirming that claim is
   * what records the payment.
   *
   * The endpoints may still exist server-side. They are simply not reachable
   * from the product, and no new caller should reintroduce one — the record
   * path in paymentInstructions.ts is the only collection surface.
   */

  // Check for existing payment intent
  static async checkExistingPaymentIntent(
    bookingId: number,
    paymentType: 'down_payment' | 'remaining_payment' | 'full_payment'
  ): Promise<PaymentResponse | null> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/payments/check-existing-intent?bookingId=${bookingId}&paymentType=${paymentType}`
      );
      
      if (response.data.status && response.data.data) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      return null;
    }
  }

  // Create payment intent
  static async createPaymentIntent(
    bookingId: number,
    customerEmail: string,
    paymentType: 'down_payment' | 'remaining_payment' | 'full_payment'
  ): Promise<PaymentResponse> {
    try {
      // First check if there's an existing incomplete payment intent
      const existingIntent = await this.checkExistingPaymentIntent(bookingId, paymentType);
      if (existingIntent) {
        return existingIntent;
      }
      
      const requestBody = {
        bookingId: Number(bookingId), // Ensure bookingId is a number
        customerEmail,
        paymentType
      };
      
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/create-payment-intent`, requestBody);

      return response.data;
    } catch (error: any) {
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
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/history`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  // Get pending payments
  static async getPendingPayments(): Promise<PendingPayment[]> {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/pending`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching pending payments:', error);
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
    // WW-CASHREFUND — money the VENDOR owes the customer back and has not yet
    // handed over. Absent on an older backend, hence optional.
    cashRefundOwedTotal?: number;
    cashRefundsOwed?: Array<{
      id: number;
      amount: number;
      reason: string | null;
      owedSince: string;
    }>;
  }> {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/booking-status/${bookingId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch booking payment status');
    }
  }

  /**
   * WW-CASHREFUND — mark a cash refund the vendor owed as handed over.
   * Idempotent server-side, so a double-tap is safe.
   */
  static async settleCashRefund(refundId: number): Promise<{ id: number; amount: number; settledAt: string }> {
    const response = await axiosInstance.post(
      `${BACKEND_URL}api/v1/payments/cash-refund/${refundId}/settle`,
      {},
    );
    return response.data.data;
  }

  // Cancel incomplete payment intents for a booking
  static async cancelIncompletePaymentIntents(bookingId: number): Promise<boolean> {
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}api/v1/payments/cancel-incomplete-intents`,
        { bookingId: Number(bookingId) }
      );
      
      return response.data.status === true;
    } catch (error: any) {
      console.error('Error cancelling incomplete payment intents:', error);
      return false;
    }
  }

  // Verify booking exists before creating payment intent
  static async verifyBookingExists(bookingId: number): Promise<boolean> {
    try {
      // 1) Primary check: direct booking lookup
      try {
        const resp = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/${bookingId}`);
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
        const found = Array.isArray(list) && list.some((b: any) => Number(b?.id) === Number(bookingId));
        return !!found;
      } catch (listErr) {
        console.error('Fallback bookings list lookup failed:', listErr);
      }

      // If neither check confirms existence, return false
      return false;
    } catch (error: any) {
      console.error('Booking verification unexpected error:', error);
      return false;
    }
  }

  // Get user bookings for payments page
  static async getUserBookings(): Promise<{
    pendingPayments: PendingPayment[];
    paymentHistory: PaymentHistory[];
  }> {
    try {
      // Use the same API endpoint as the bookings page
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);

      const bookings = response.data.data || [];

      // Organize bookings by payment status
      const pendingPayments: PendingPayment[] = [];
      const paymentHistory: PaymentHistory[] = [];
      
      bookings.forEach((booking: any) => {
        const statusLower  = String(booking.status        || '').toLowerCase();
        const paymentLower = String(booking.paymentStatus || '').toLowerCase();

        // Skip cancelled bookings entirely
        if (statusLower === 'cancelled') return;

        const businesses = booking.bookingDetails?.map((detail: any) => ({
          id: detail.businessId,
          name: detail.business?.name || 'Business',
        })) || [];

        const determinedPaymentType = this.determinePaymentType(booking.status, booking.paymentStatus);
        const calculatedAmount      = this.calculatePaymentAmount(booking.status, booking.paymentStatus, booking.totalAmount, booking.downPayment);

        const paymentData = {
          id:            booking.id,
          bookingId:     booking.id,
          customerName:  booking.customerName  || 'Customer',
          bookingDate:   booking.bookingDate,
          bookingTime:   booking.bookingTime,
          businesses,
          paymentType:   determinedPaymentType,
          amount:        calculatedAmount,
          currency:      'PKR',
          status:        booking.status,
          paymentStatus: booking.paymentStatus,
          createdAt:     booking.createdAt,
          totalAmount:   booking.totalAmount,
          downPayment:   booking.downPayment,
        };

        if (paymentLower === 'paid' || statusLower === 'completed') {
          paymentHistory.push({
            ...paymentData,
            status:     'completed',
            updatedAt:  paymentData.createdAt,
            bookingDetails: {
              customerName: paymentData.customerName,
              bookingDate:  paymentData.bookingDate,
              businesses:   paymentData.businesses,
            },
          });
        } else {
          pendingPayments.push(paymentData);
        }
      });
      
      return { pendingPayments, paymentHistory };
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
      return { pendingPayments: [], paymentHistory: [] };
    }
  }
  
  // Determine payment type based on booking and payment status (case-insensitive)
  private static determinePaymentType(bookingStatus: string, paymentStatus: string): 'down_payment' | 'remaining_payment' | 'full_payment' {
    const status  = (bookingStatus  || '').toLowerCase();
    const payment = (paymentStatus || '').toLowerCase();

    // isSettled covers Partially Refunded too — see lib/payment-status.ts.
    // Without it a partly refunded booking falls through to the down_payment
    // default below and reappears in the couple's Pending Payments, asking
    // for a deposit they already paid.
    if (status === 'completed' || isSettled(payment)) return 'full_payment';
    if ((status === 'confirmed') && payment === 'partial') return 'remaining_payment';
    // "awaiting payment" or "pending" with pending payment → down payment
    return 'down_payment';
  }
  
  // Calculate payment amount based on status and downPayment field (case-insensitive)
  private static calculatePaymentAmount(bookingStatus: string, paymentStatus: string, totalAmount: number, downPayment: number): number {
    const status  = (bookingStatus  || '').toLowerCase();
    const payment = (paymentStatus || '').toLowerCase();

    if (isSettled(payment) || status === 'completed') return Number(totalAmount) || 0;
    if (status === 'confirmed' && payment === 'partial') {
      return Number(totalAmount) - Number(downPayment || 0);
    }
    // awaiting payment or pending → down payment amount
    return Number(downPayment) || Number(totalAmount) || 0;
  }
}
