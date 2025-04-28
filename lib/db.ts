import { neon } from "@neondatabase/serverless"

// Create a SQL client
const sql =
  process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? neon((process.env.DATABASE_URL || process.env.POSTGRES_URL) as string)
    : null

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  try {
    if (!sql) {
      throw new Error(
        "Database connection string not found. Please set DATABASE_URL or POSTGRES_URL environment variable.",
      )
    }

    let result

    // For parameterized queries
    if (params && params.length > 0) {
      // Use sql.query for parameterized queries
      result = await sql.query(text, params)
    } else {
      // For non-parameterized queries, use sql.query with just the text
      result = await sql.query(text)
    }

    // Log the result structure for debugging
    console.log("Query result structure:", {
      isArray: Array.isArray(result),
      hasRows: result && typeof result === "object" && "rows" in result,
      resultType: typeof result,
    })

    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Function to ensure the bookings table exists
export async function ensureBookingsTableExists() {
  try {
    // Check if we're in a development/preview environment without DB access
    if (!sql) {
      console.warn("No database connection string found. Running in mock mode.")
      return true
    }

    // Check if the table exists using tagged template literal
    const tableExistsResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
      );
    `

    // Extract the exists value safely
    // The result might be an array or an object with a rows property
    let exists = false

    if (Array.isArray(tableExistsResult) && tableExistsResult.length > 0) {
      exists = tableExistsResult[0].exists === true
    } else if (Array.isArray(tableExistsResult) && tableExistsResult.length > 0) {
      exists = tableExistsResult[0].exists === true
    }

    // If the table doesn't exist, create it
    if (!exists) {
      console.log("Creating bookings table...")
      await sql`
        CREATE TABLE bookings (
          id SERIAL PRIMARY KEY,
          booking_reference VARCHAR(20) NOT NULL UNIQUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          
          -- User Information
          username VARCHAR(100) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          email VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          
          -- Booking Details
          booking_date DATE NOT NULL,
          time_slot VARCHAR(20) NOT NULL,
          guest_count INTEGER NOT NULL,
          
          -- Package Selection
          package_id VARCHAR(20) NOT NULL,
          package_price DECIMAL(10,2) NOT NULL,
          
          -- Menu Selection
          menu_id VARCHAR(20) NOT NULL,
          menu_price DECIMAL(10,2) NOT NULL,
          menu_addons JSON,
          addons_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          
          -- Vendor Selection
          vendors JSON,
          vendors_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          
          -- Vendor Packages
          vendor_packages JSON,
          vendor_packages_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          
          -- Pricing Information
          total_price DECIMAL(10,2) NOT NULL,
          deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          balance_due DECIMAL(10,2) NOT NULL,
          payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
          
          -- Additional Information
          special_requests TEXT,
          terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
          
          -- Event Type (for multi-event bookings)
          event_type VARCHAR(50)
        )
      `
      console.log("Bookings table created successfully")
      return true
    }

    console.log("Bookings table already exists")
    return true
  } catch (error) {
    console.error("Error ensuring bookings table exists:", error)
    // Instead of throwing the error, return false to allow the application to continue
    return false
  }
}
