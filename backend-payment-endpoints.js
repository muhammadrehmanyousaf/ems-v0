// Backend Payment Endpoints Implementation
// Add these endpoints to your backend server

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// 1. Check for existing payment intent
router.get('/api/v1/payments/check-existing-intent', async (req, res) => {
  try {
    const { bookingId, paymentType } = req.query;
    
    console.log('🔍 Backend: Checking existing payment intent for:', { bookingId, paymentType });
    
    // Query your database for existing incomplete payment intents
    const existingPayment = await db.query(`
      SELECT * FROM payment_intents 
      WHERE booking_id = ? 
      AND payment_type = ? 
      AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
      ORDER BY created_at DESC 
      LIMIT 1
    `, [bookingId, paymentType]);
    
    if (existingPayment.length > 0) {
      const payment = existingPayment[0];
      console.log('🔍 Backend: Found existing payment intent:', payment.stripe_payment_intent_id);
      
      // Retrieve the payment intent from Stripe to get current status
      const stripePaymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      
      if (stripePaymentIntent.status === 'requires_payment_method' || 
          stripePaymentIntent.status === 'requires_confirmation' || 
          stripePaymentIntent.status === 'requires_action') {
        
        return res.json({
          status: true,
          data: {
            id: stripePaymentIntent.id,
            clientSecret: stripePaymentIntent.client_secret,
            status: stripePaymentIntent.status,
            amount: stripePaymentIntent.amount,
            currency: stripePaymentIntent.currency
          }
        });
      }
    }
    
    console.log('🔍 Backend: No existing payment intent found');
    return res.json({
      status: false,
      message: 'No existing payment intent found'
    });
    
  } catch (error) {
    console.error('🔍 Backend: Error checking existing payment intent:', error);
    return res.status(500).json({
      status: false,
      message: 'Error checking existing payment intent'
    });
  }
});

// 2. Cancel incomplete payment intents
router.post('/api/v1/payments/cancel-incomplete-intents', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    console.log('🔍 Backend: Cancelling incomplete payment intents for booking:', bookingId);
    
    // Find all incomplete payment intents for this booking
    const incompletePayments = await db.query(`
      SELECT * FROM payment_intents 
      WHERE booking_id = ? 
      AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
    `, [bookingId]);
    
    let cancelledCount = 0;
    
    for (const payment of incompletePayments) {
      try {
        // Cancel the payment intent in Stripe
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
        
        // Update status in database
        await db.query(`
          UPDATE payment_intents 
          SET status = 'canceled', updated_at = NOW() 
          WHERE id = ?
        `, [payment.id]);
        
        cancelledCount++;
        console.log('🔍 Backend: Cancelled payment intent:', payment.stripe_payment_intent_id);
        
      } catch (stripeError) {
        console.error('🔍 Backend: Error cancelling payment intent:', stripeError);
        // Continue with other payments even if one fails
      }
    }
    
    console.log('🔍 Backend: Cancelled', cancelledCount, 'payment intents');
    
    return res.json({
      status: true,
      message: `Cancelled ${cancelledCount} incomplete payment intents`,
      cancelledCount
    });
    
  } catch (error) {
    console.error('🔍 Backend: Error cancelling incomplete payment intents:', error);
    return res.status(500).json({
      status: false,
      message: 'Error cancelling incomplete payment intents'
    });
  }
});

// 3. Cleanup duplicates (optional)
router.post('/api/v1/payments/cleanup-duplicates', async (req, res) => {
  try {
    console.log('🔍 Backend: Starting cleanup of duplicate payment intents');
    
    // Find all incomplete payment intents
    const incompletePayments = await db.query(`
      SELECT * FROM payment_intents 
      WHERE status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
      ORDER BY booking_id, created_at DESC
    `);
    
    let cancelledCount = 0;
    const processedBookings = new Set();
    
    for (const payment of incompletePayments) {
      // Skip if we've already processed this booking
      if (processedBookings.has(payment.booking_id)) {
        try {
          // Cancel this duplicate payment intent
          await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
          
          await db.query(`
            UPDATE payment_intents 
            SET status = 'canceled', updated_at = NOW() 
            WHERE id = ?
          `, [payment.id]);
          
          cancelledCount++;
          console.log('🔍 Backend: Cancelled duplicate payment intent:', payment.stripe_payment_intent_id);
          
        } catch (stripeError) {
          console.error('🔍 Backend: Error cancelling duplicate payment intent:', stripeError);
        }
      } else {
        // Mark this booking as processed (keep the first/latest payment intent)
        processedBookings.add(payment.booking_id);
      }
    }
    
    console.log('🔍 Backend: Cleanup complete. Cancelled', cancelledCount, 'duplicate payment intents');
    
    return res.json({
      status: true,
      message: `Cleaned up ${cancelledCount} duplicate payment intents`,
      cancelledCount
    });
    
  } catch (error) {
    console.error('🔍 Backend: Error cleaning up duplicates:', error);
    return res.status(500).json({
      status: false,
      message: 'Error cleaning up duplicate payment intents'
    });
  }
});

// 4. Enhanced create payment intent (with duplicate prevention)
router.post('/api/v1/payments/create-payment-intent', async (req, res) => {
  try {
    const { bookingId, customerEmail, paymentType } = req.body;
    
    console.log('🔍 Backend: Creating payment intent with duplicate prevention:', { bookingId, customerEmail, paymentType });
    
    // First, check for existing incomplete payment intents
    const existingPayment = await db.query(`
      SELECT * FROM payment_intents 
      WHERE booking_id = ? 
      AND payment_type = ? 
      AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
      ORDER BY created_at DESC 
      LIMIT 1
    `, [bookingId, paymentType]);
    
    if (existingPayment.length > 0) {
      const payment = existingPayment[0];
      console.log('🔍 Backend: Found existing payment intent, reusing it:', payment.stripe_payment_intent_id);
      
      // Retrieve the payment intent from Stripe
      const stripePaymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
      
      if (stripePaymentIntent.status === 'requires_payment_method' || 
          stripePaymentIntent.status === 'requires_confirmation' || 
          stripePaymentIntent.status === 'requires_action') {
        
        return res.json({
          status: true,
          data: {
            id: stripePaymentIntent.id,
            clientSecret: stripePaymentIntent.client_secret,
            status: stripePaymentIntent.status,
            amount: stripePaymentIntent.amount,
            currency: stripePaymentIntent.currency
          }
        });
      }
    }
    
    // Cancel any other incomplete payment intents for this booking
    const otherIncompletePayments = await db.query(`
      SELECT * FROM payment_intents 
      WHERE booking_id = ? 
      AND status IN ('requires_payment_method', 'requires_confirmation', 'requires_action')
    `, [bookingId]);
    
    for (const payment of otherIncompletePayments) {
      try {
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
        await db.query(`
          UPDATE payment_intents 
          SET status = 'canceled', updated_at = NOW() 
          WHERE id = ?
        `, [payment.id]);
        console.log('🔍 Backend: Cancelled other incomplete payment intent:', payment.stripe_payment_intent_id);
      } catch (stripeError) {
        console.error('🔍 Backend: Error cancelling other payment intent:', stripeError);
      }
    }
    
    // Get booking details to calculate amount
    const booking = await db.query(`
      SELECT * FROM bookings WHERE id = ?
    `, [bookingId]);
    
    if (booking.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Booking not found'
      });
    }
    
    const bookingData = booking[0];
    let amount;
    
    // Calculate amount based on payment type
    if (paymentType === 'down_payment') {
      amount = Math.round(bookingData.total_amount * 0.2 * 100); // 20% down payment
    } else if (paymentType === 'full_payment') {
      amount = Math.round(bookingData.total_amount * 100);
    } else if (paymentType === 'remaining_payment') {
      amount = Math.round(bookingData.total_amount * 0.8 * 100); // 80% remaining
    }
    
    // Create new payment intent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        payment_type: paymentType
      },
      description: `${paymentType === 'down_payment' ? 'Down Payment' : paymentType === 'full_payment' ? 'Full Payment' : 'Remaining Payment'} for Booking #${bookingId}`
    });
    
    // Save payment intent to database
    await db.query(`
      INSERT INTO payment_intents (
        booking_id, 
        stripe_payment_intent_id, 
        payment_type, 
        amount, 
        currency, 
        status, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      bookingId,
      paymentIntent.id,
      paymentType,
      amount,
      'usd',
      paymentIntent.status
    ]);
    
    console.log('🔍 Backend: Created new payment intent:', paymentIntent.id);
    
    return res.json({
      status: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        bookingDetails: {
          id: bookingId,
          customerName: bookingData.customer_name,
          bookingDate: bookingData.booking_date,
          bookingTime: bookingData.booking_time,
          status: bookingData.status,
          paymentStatus: bookingData.payment_status,
          businesses: [
            {
              id: 1,
              name: "Royal Palace Event Complex"
            },
            {
              id: 2,
              name: "Lahore Palace"
            }
          ]
        },
        paymentDetails: {
          type: paymentType,
          amount: amount / 100, // Convert from cents to dollars
          currency: paymentIntent.currency,
          expectedAmount: amount / 100
        }
      }
    });
    
  } catch (error) {
    console.error('🔍 Backend: Error creating payment intent:', error);
    return res.status(500).json({
      status: false,
      message: 'Error creating payment intent'
    });
  }
});

module.exports = router;
