# Duplicate Payment Intent Fix - Implementation Guide

## 🚨 **Current Issue**

You're still seeing duplicate payment intents in Stripe because the backend endpoints for duplicate prevention haven't been implemented yet. The frontend is calling these endpoints, but they don't exist, so the duplicate prevention logic isn't working.

## 🔧 **Required Backend Implementation**

### **Step 1: Add the Backend Endpoints**

Add the following endpoints to your backend server:

```javascript
// Add these routes to your existing payment routes file
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// 1. Check for existing payment intent
router.get('/api/v1/payments/check-existing-intent', async (req, res) => {
  try {
    const { bookingId, paymentType } = req.query;
    
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
    
    return res.json({
      status: false,
      message: 'No existing payment intent found'
    });
    
  } catch (error) {
    console.error('Error checking existing payment intent:', error);
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
        
      } catch (stripeError) {
        console.error('Error cancelling payment intent:', stripeError);
      }
    }
    
    return res.json({
      status: true,
      message: `Cancelled ${cancelledCount} incomplete payment intents`,
      cancelledCount
    });
    
  } catch (error) {
    console.error('Error cancelling incomplete payment intents:', error);
    return res.status(500).json({
      status: false,
      message: 'Error cancelling incomplete payment intents'
    });
  }
});

// 3. Cleanup duplicates
router.post('/api/v1/payments/cleanup-duplicates', async (req, res) => {
  try {
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
          
        } catch (stripeError) {
          console.error('Error cancelling duplicate payment intent:', stripeError);
        }
      } else {
        // Mark this booking as processed (keep the first/latest payment intent)
        processedBookings.add(payment.booking_id);
      }
    }
    
    return res.json({
      status: true,
      message: `Cleaned up ${cancelledCount} duplicate payment intents`,
      cancelledCount
    });
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    return res.status(500).json({
      status: false,
      message: 'Error cleaning up duplicate payment intents'
    });
  }
});

module.exports = router;
```

### **Step 2: Create the Database Table**

Run this SQL to create the required table:

```sql
CREATE TABLE IF NOT EXISTS payment_intents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  payment_type ENUM('down_payment', 'remaining_payment', 'full_payment') NOT NULL,
  amount INT NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_booking_id (booking_id),
  INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
  INDEX idx_status (status),
  INDEX idx_payment_type (payment_type)
);
```

### **Step 3: Update Your Existing Payment Intent Creation**

Modify your existing payment intent creation endpoint to save to the database:

```javascript
// In your existing create-payment-intent endpoint
router.post('/api/v1/payments/create-payment-intent', async (req, res) => {
  try {
    const { bookingId, customerEmail, paymentType } = req.body;
    
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
      } catch (stripeError) {
        console.error('Error cancelling other payment intent:', stripeError);
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
    
    return res.json({
      status: true,
      data: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      status: false,
      message: 'Error creating payment intent'
    });
  }
});
```

## 🧹 **Step 4: Clean Up Existing Duplicates**

### **Option A: Use the Cleanup Script**

1. Install dependencies:
```bash
npm install stripe mysql2
```

2. Set environment variables:
```bash
export STRIPE_SECRET_KEY="sk_test_..."
export DB_HOST="localhost"
export DB_USER="root"
export DB_PASSWORD=""
export DB_NAME="ems_db"
```

3. Run the cleanup script:
```bash
node cleanup-duplicate-payments.js
```

### **Option B: Manual Cleanup via Stripe Dashboard**

1. Go to your Stripe Dashboard
2. Navigate to Payments → All payments
3. Filter by "Incomplete" status
4. Manually cancel duplicate payment intents for the same booking

### **Option C: Use the Cleanup Button**

1. Go to `/user/payments` in your app
2. Click the "Cleanup Duplicates" button
3. This will call the cleanup endpoint to remove duplicates

## 🧪 **Step 5: Test the Fix**

### **Test 1: Duplicate Prevention**
1. Go to `/user/payments`
2. Click "Pay" on any pending payment
3. Close the modal without completing payment
4. Click "Pay" again on the same payment
5. **Expected**: Should reuse the same payment intent, not create a new one

### **Test 2: Full Payment Option**
1. Go to `/user/payments`
2. Find a pending booking with down payment option
3. You should see both "Pay Down Payment" and "Pay Full Amount" buttons
4. Test both options to ensure they work correctly

### **Test 3: Cleanup Functionality**
1. Go to `/user/payments`
2. Click "Cleanup Duplicates" button
3. **Expected**: Should cancel all incomplete payment intents in Stripe

## 🔍 **Step 6: Monitor Results**

After implementing the backend endpoints:

1. **Check Stripe Dashboard**: Look for new duplicate payment intents
2. **Monitor Logs**: Check backend logs for payment intent creation
3. **Test Payment Flow**: Ensure payments still work correctly
4. **User Experience**: Verify users can complete payments without issues

## 🚨 **Important Notes**

1. **Database Required**: The duplicate prevention requires a database to track payment intents
2. **Stripe Metadata**: Ensure your payment intents include booking_id and payment_type in metadata
3. **Error Handling**: The endpoints include proper error handling for Stripe API failures
4. **Performance**: The database queries are optimized with proper indexes

## 🎯 **Expected Results**

After implementing these changes:
- ✅ No more duplicate payment intents in Stripe
- ✅ Cleaner Stripe dashboard
- ✅ Better user experience
- ✅ Fewer unnecessary Stripe API calls
- ✅ Cost savings

## 🆘 **Troubleshooting**

### **If duplicates still appear:**
1. Check if the backend endpoints are properly implemented
2. Verify the database table exists and has data
3. Check backend logs for errors
4. Ensure Stripe metadata is being set correctly

### **If payments fail:**
1. Check Stripe API key configuration
2. Verify database connection
3. Check error logs for specific issues
4. Test with Stripe test mode first

The frontend is already implemented and ready to work with these backend endpoints. Once you implement the backend, the duplicate payment intent issue will be completely resolved!
