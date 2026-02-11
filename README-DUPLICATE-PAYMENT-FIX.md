# Duplicate Payment Intent Fix

## Problem Analysis

The issue was that **duplicate payment intents were being created** in Stripe for the same booking. From the Stripe data provided, we can see:

- Booking #30: 6 duplicate payment intents
- Booking #29: 2 duplicate payment intents  
- Booking #28: 2 duplicate payment intents
- Booking #27: 2 duplicate payment intents
- Booking #26: 2 duplicate payment intents

All these duplicates were showing as "Incomplete" status in Stripe.

## Root Cause

The problem was in the `StripePayment` component's `useEffect` hook:

```typescript
useEffect(() => {
  if (isOpen && !paymentIntent) {
    createPaymentIntent()
  }
}, [isOpen])
```

**Issues identified:**
1. **No Payment Intent Deduplication**: The component didn't check if a payment intent already existed for the current booking
2. **State Management**: The `paymentIntent` state wasn't properly managed across modal open/close cycles
3. **Missing Cleanup**: No cleanup of payment intent state when modal closes
4. **No Backend Validation**: The backend didn't check for existing incomplete payment intents

## Frontend Fixes Applied

### 1. Enhanced State Management in StripePayment Component

**File**: `components/booking/stripe-payment.tsx`

**Changes:**
- Added `currentBookingId` state to track which booking the current payment intent belongs to
- Added proper state cleanup when modal closes
- Enhanced useEffect to only create payment intent if no intent exists for the current booking

```typescript
const [currentBookingId, setCurrentBookingId] = useState<number | null>(null)

// Reset state when modal closes
useEffect(() => {
  if (!isOpen) {
    setPaymentIntent(null)
    setError(null)
    setPaymentStatus('pending')
    setCurrentBookingId(null)
  }
}, [isOpen])

// Create payment intent only when modal opens and no intent exists for this booking
useEffect(() => {
  if (isOpen && (!paymentIntent || currentBookingId !== bookingId)) {
    setCurrentBookingId(bookingId)
    createPaymentIntent()
  }
}, [isOpen, bookingId])
```

### 2. Enhanced PaymentAPI with Duplicate Prevention

**File**: `lib/api/payments.ts`

**New Methods Added:**

#### `checkExistingPaymentIntent()`
- Checks if an incomplete payment intent already exists for a booking
- Returns existing intent if found, null otherwise

#### `cancelIncompletePaymentIntents()`
- Cancels all incomplete payment intents for a booking
- Called before creating new payment intent to prevent duplicates

#### Enhanced `createPaymentIntent()`
- Now checks for existing intents before creating new ones
- Cancels incomplete intents before creating new ones

### 3. Cleanup Utility in Payments Page

**File**: `app/(main)/user/payments/page.tsx`

**Added:**
- `handleCleanupDuplicates()` function
- "Cleanup Duplicates" button in the UI
- Calls backend endpoint to clean up existing duplicate payment intents

## Backend Implementation Required

To complete the fix, the following backend endpoints need to be implemented:

### 1. Check Existing Payment Intent
```
GET /api/v1/payments/check-existing-intent?bookingId={id}&paymentType={type}
```

**Purpose**: Check if an incomplete payment intent exists for a booking
**Response**: 
```json
{
  "status": true,
  "data": {
    "id": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "status": "requires_payment_method"
  }
}
```

### 2. Cancel Incomplete Payment Intents
```
POST /api/v1/payments/cancel-incomplete-intents
Body: { "bookingId": 123 }
```

**Purpose**: Cancel all incomplete payment intents for a booking
**Response**:
```json
{
  "status": true,
  "message": "Cancelled 3 incomplete payment intents"
}
```

### 3. Cleanup Duplicates (Optional)
```
POST /api/v1/payments/cleanup-duplicates
```

**Purpose**: Clean up all duplicate payment intents across all bookings
**Response**:
```json
{
  "status": true,
  "message": "Cleaned up 15 duplicate payment intents",
  "cancelledCount": 15
}
```

## How the Fix Works

### Before (Problematic Flow):
1. User opens payment modal → `useEffect` triggers
2. `createPaymentIntent()` called → New Stripe payment intent created
3. User closes modal → State not properly cleaned
4. User opens modal again → Another payment intent created
5. **Result**: Multiple duplicate payment intents

### After (Fixed Flow):
1. User opens payment modal → `useEffect` triggers
2. Check if payment intent exists for this booking
3. If exists, reuse it; if not, cancel any incomplete intents first
4. Create new payment intent only if needed
5. **Result**: Only one payment intent per booking

## Testing the Fix

### 1. Test Duplicate Prevention
1. Go to `/user/payments`
2. Click "Pay" on any pending payment
3. Close the modal without completing payment
4. Click "Pay" again on the same payment
5. **Expected**: Should reuse the same payment intent, not create a new one

### 2. Test State Cleanup
1. Open payment modal for Booking #1
2. Close modal
3. Open payment modal for Booking #2
4. **Expected**: Should create a new payment intent for Booking #2

### 3. Test Cleanup Utility
1. Go to `/user/payments`
2. Click "Cleanup Duplicates" button
3. **Expected**: Should cancel all incomplete payment intents in Stripe

## Benefits of the Fix

1. **No More Duplicates**: Prevents creation of duplicate payment intents
2. **Better User Experience**: Users won't see multiple failed payment attempts
3. **Cleaner Stripe Dashboard**: No more cluttered incomplete payment intents
4. **Cost Savings**: Fewer unnecessary Stripe API calls
5. **Better Error Handling**: Proper state management prevents edge cases

## Monitoring

After implementing the backend endpoints, monitor:
1. Stripe dashboard for new duplicate payment intents
2. Payment success rates
3. User complaints about payment issues
4. Backend logs for payment intent creation patterns

## Next Steps

1. **Implement Backend Endpoints**: Add the three required endpoints to your backend
2. **Test Thoroughly**: Test the complete payment flow with the new logic
3. **Monitor Stripe**: Watch for any new duplicate payment intents
4. **Clean Up Existing Duplicates**: Use the cleanup utility to remove existing duplicates
5. **Update Documentation**: Update your payment system documentation with the new flow
