// Cleanup Script for Duplicate Payment Intents
// Run this script to clean up existing duplicate payment intents in Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2/promise');

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ems_db'
};

async function cleanupDuplicatePaymentIntents() {
  let connection;
  
  try {
    console.log('🔍 Starting cleanup of duplicate payment intents...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // 1. Get all incomplete payment intents from Stripe
    console.log('🔍 Fetching incomplete payment intents from Stripe...');
    const incompleteIntents = await stripe.paymentIntents.list({
      limit: 100,
      status: 'requires_payment_method'
    });
    
    console.log(`📊 Found ${incompleteIntents.data.length} incomplete payment intents in Stripe`);
    
    // 2. Group by booking ID and payment type
    const groupedIntents = {};
    
    for (const intent of incompleteIntents.data) {
      const bookingId = intent.metadata?.booking_id;
      const paymentType = intent.metadata?.payment_type;
      
      if (bookingId && paymentType) {
        const key = `${bookingId}_${paymentType}`;
        
        if (!groupedIntents[key]) {
          groupedIntents[key] = [];
        }
        
        groupedIntents[key].push({
          id: intent.id,
          created: intent.created,
          amount: intent.amount,
          description: intent.description
        });
      }
    }
    
    console.log(`📊 Grouped into ${Object.keys(groupedIntents).length} unique booking/payment type combinations`);
    
    // 3. Find and cancel duplicates
    let cancelledCount = 0;
    let keptCount = 0;
    
    for (const [key, intents] of Object.entries(groupedIntents)) {
      if (intents.length > 1) {
        console.log(`🔍 Processing ${intents.length} intents for ${key}`);
        
        // Sort by creation date (keep the newest, cancel the rest)
        intents.sort((a, b) => b.created - a.created);
        
        // Keep the first (newest) intent
        const keepIntent = intents[0];
        keptCount++;
        console.log(`✅ Keeping intent: ${keepIntent.id} (created: ${new Date(keepIntent.created * 1000).toISOString()})`);
        
        // Cancel the rest
        for (let i = 1; i < intents.length; i++) {
          const cancelIntent = intents[i];
          
          try {
            await stripe.paymentIntents.cancel(cancelIntent.id);
            cancelledCount++;
            console.log(`❌ Cancelled duplicate intent: ${cancelIntent.id} (created: ${new Date(cancelIntent.created * 1000).toISOString()})`);
            
            // Update database if you have one
            try {
              await connection.execute(
                'UPDATE payment_intents SET status = ? WHERE stripe_payment_intent_id = ?',
                ['canceled', cancelIntent.id]
              );
              console.log(`📝 Updated database for cancelled intent: ${cancelIntent.id}`);
            } catch (dbError) {
              console.log(`⚠️  Could not update database for ${cancelIntent.id}:`, dbError.message);
            }
            
          } catch (cancelError) {
            console.error(`❌ Error cancelling intent ${cancelIntent.id}:`, cancelError.message);
          }
        }
      } else {
        // Only one intent for this booking/payment type, keep it
        keptCount++;
        console.log(`✅ Keeping single intent: ${intents[0].id} for ${key}`);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Kept: ${keptCount} payment intents`);
    console.log(`   - Cancelled: ${cancelledCount} duplicate payment intents`);
    console.log(`   - Total processed: ${keptCount + cancelledCount} payment intents`);
    
    // 4. Show remaining incomplete intents
    console.log('\n🔍 Checking remaining incomplete intents...');
    const remainingIntents = await stripe.paymentIntents.list({
      limit: 100,
      status: 'requires_payment_method'
    });
    
    console.log(`📊 Remaining incomplete intents: ${remainingIntents.data.length}`);
    
    if (remainingIntents.data.length > 0) {
      console.log('\n📋 Remaining incomplete intents:');
      for (const intent of remainingIntents.data) {
        console.log(`   - ${intent.id}: ${intent.description} (${intent.amount/100} ${intent.currency.toUpperCase()})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// 5. Function to clean up specific booking
async function cleanupBookingDuplicates(bookingId) {
  let connection;
  
  try {
    console.log(`🔍 Cleaning up duplicates for booking ${bookingId}...`);
    
    connection = await mysql.createConnection(dbConfig);
    
    // Get all incomplete intents for this booking
    const intents = await stripe.paymentIntents.list({
      limit: 100,
      status: 'requires_payment_method'
    });
    
    const bookingIntents = intents.data.filter(intent => 
      intent.metadata?.booking_id === bookingId.toString()
    );
    
    console.log(`📊 Found ${bookingIntents.length} incomplete intents for booking ${bookingId}`);
    
    if (bookingIntents.length > 1) {
      // Group by payment type
      const groupedByType = {};
      
      for (const intent of bookingIntents) {
        const paymentType = intent.metadata?.payment_type || 'unknown';
        
        if (!groupedByType[paymentType]) {
          groupedByType[paymentType] = [];
        }
        
        groupedByType[paymentType].push(intent);
      }
      
      // Cancel duplicates for each payment type
      for (const [paymentType, typeIntents] of Object.entries(groupedByType)) {
        if (typeIntents.length > 1) {
          console.log(`🔍 Processing ${typeIntents.length} ${paymentType} intents for booking ${bookingId}`);
          
          // Sort by creation date (keep newest)
          typeIntents.sort((a, b) => b.created - a.created);
          
          // Keep the first, cancel the rest
          const keepIntent = typeIntents[0];
          console.log(`✅ Keeping ${paymentType} intent: ${keepIntent.id}`);
          
          for (let i = 1; i < typeIntents.length; i++) {
            const cancelIntent = typeIntents[i];
            
            try {
              await stripe.paymentIntents.cancel(cancelIntent.id);
              console.log(`❌ Cancelled duplicate ${paymentType} intent: ${cancelIntent.id}`);
            } catch (error) {
              console.error(`❌ Error cancelling ${cancelIntent.id}:`, error.message);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up booking duplicates:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the cleanup
if (require.main === module) {
  const bookingId = process.argv[2];
  
  if (bookingId) {
    cleanupBookingDuplicates(bookingId);
  } else {
    cleanupDuplicatePaymentIntents();
  }
}

module.exports = {
  cleanupDuplicatePaymentIntents,
  cleanupBookingDuplicates
};
