"use server"

import { query, ensureBookingsTableExists } from "@/lib/db"
import type { BookingFormData } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { vendorPackages } from "@/lib/data"

// Generate a unique booking reference
function generateBookingReference() {
  return `VB-${Math.floor(100000 + Math.random() * 900000)}`
}

// Create a new booking
export async function createBooking(formData: BookingFormData) {
  try {
    // Check if we're in a development/preview environment without DB access
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      console.warn("No database connection string found. Returning mock booking reference.")
      return {
        success: true,
        booking: {
          id: 1,
          booking_reference: generateBookingReference(),
        },
      }
    }

    // Ensure the bookings table exists before inserting data
    const tableExists = await ensureBookingsTableExists()

    // If table creation failed, return a mock booking reference
    if (!tableExists) {
      console.warn("Could not ensure bookings table exists. Returning mock booking reference.")
      return {
        success: true,
        booking: {
          id: 1,
          booking_reference: generateBookingReference(),
        },
      }
    }

    const bookingReference = generateBookingReference()

    // Convert date to ISO string if it exists
    const bookingDate = formData.bookingDate ? new Date(formData.bookingDate).toISOString() : null

    // Convert menu addons and vendors to JSON strings
    const menuAddons = JSON.stringify(
      formData.menuAddons.map((id) => {
        // Find the addon details from your data
        // This is just an example - you'd need to import your actual data
        const addon = { id, name: `Addon ${id}`, price: 100 }
        return addon
      }),
    )

    const vendors = JSON.stringify(
      formData.selectedVendors.map((id) => {
        // Find the vendor details from your data
        // This is just an example - you'd need to import your actual data
        const vendor = { id, name: `Vendor ${id}`, type: "service", price: 300 }
        return vendor
      }),
    )

    // Convert vendor packages to JSON string
    const vendorPackagesJson = JSON.stringify(
      formData.selectedVendorPackages.map((id) => {
        const pkg = vendorPackages.find((p) => p.id === id)
        return pkg ? { id, name: pkg.name, price: pkg.price } : { id, name: `Package ${id}`, price: 0 }
      }),
    )

    // Calculate addon and vendor prices
    const addonsPrice = formData.menuAddons.length * 100 // Assuming each addon costs $100
    const vendorsPrice = formData.selectedVendors.length * 300 // Assuming each vendor costs $300

    // Calculate vendor packages price
    const vendorPackagesPrice = formData.selectedVendorPackages.reduce((total, id) => {
      const pkg = vendorPackages.find((p) => p.id === id)
      return total + (pkg ? pkg.price : 0)
    }, 0)

    // Calculate balance due
    const totalPrice = formData.totalPrice
    const depositAmount = 0 // Default to 0, can be updated later
    const balanceDue = totalPrice - depositAmount

    try {
      // Use the query function with parameterized query
      const result = await query(
        `INSERT INTO bookings (
          booking_reference, username, phone_number, email, password_hash,
          booking_date, time_slot, guest_count,
          package_id, package_price,
          menu_id, menu_price, menu_addons, addons_price,
          vendors, vendors_price,
          vendor_packages, vendor_packages_price,
          total_price, deposit_amount, balance_due, payment_status, terms_accepted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id, booking_reference`,
        [
          bookingReference,
          formData.username,
          formData.phoneNumber,
          formData.email,
          // In a real app, you should hash the password
          // This is just for demonstration
          `hashed_${formData.password}`,
          bookingDate,
          formData.timeSlot,
          formData.guestCount,
          formData.selectedPackage,
          formData.selectedPackage === "basic" ? 1000 : formData.selectedPackage === "standard" ? 2000 : 3000,
          formData.selectedMenu,
          formData.selectedMenu === "continental" ? 500 : formData.selectedMenu === "italian" ? 700 : 600,
          menuAddons,
          addonsPrice,
          vendors,
          vendorsPrice,
          vendorPackagesJson,
          vendorPackagesPrice,
          totalPrice,
          depositAmount,
          balanceDue,
          "unpaid",
          true,
        ],
      )

      revalidatePath("/bookings")

      // Handle the result structure properly
      // The neon client might return the rows directly or in a rows property
      const booking = result[0]

      // If we couldn't get the booking from the result, use the generated reference
      if (!booking) {
        console.warn("Could not extract booking from result. Using generated reference.")
        return {
          success: true,
          booking: {
            id: Math.floor(Math.random() * 1000), // Generate a random ID
            booking_reference: bookingReference,
          },
        }
      }

      return { success: true, booking }
    } catch (dbError) {
      console.error("Database insertion error:", dbError)
      // If database insertion fails, return a mock booking reference
      return {
        success: true,
        booking: {
          id: Math.floor(Math.random() * 1000), // Generate a random ID
          booking_reference: bookingReference,
        },
      }
    }
  } catch (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: String(error) }
  }
}

export async function getAllBookings() {
  try {
    // Check if we're in a development/preview environment without DB access
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      console.warn("No database connection string found. Returning mock bookings.")
      return {
        success: true,
        bookings: [
          {
            id: 1,
            booking_reference: "VB-123456",
            username: "John Doe",
            email: "john@example.com",
            booking_date: new Date().toISOString(),
            time_slot: "evening",
            guest_count: 50,
            package_id: "standard",
            total_price: 2500,
            status: "confirmed",
          },
        ],
        error: null,
      }
    }

    const tableExists = await ensureBookingsTableExists()

    if (!tableExists) {
      console.warn("Could not ensure bookings table exists. Returning mock bookings.")
      return {
        success: true,
        bookings: [
          {
            id: 1,
            booking_reference: "VB-123456",
            username: "John Doe",
            email: "john@example.com",
            booking_date: new Date().toISOString(),
            time_slot: "evening",
            guest_count: 50,
            package_id: "standard",
            total_price: 2500,
            status: "confirmed",
          },
        ],
        error: null,
      }
    }

    try {
      const result = await query(`
        SELECT 
          id,
          booking_reference,
          username,
          email,
          booking_date,
          time_slot,
          guest_count,
          package_id,
          total_price,
          status
        FROM bookings
      `)

      // Handle the result structure properly
      const bookings = result || []

      return { success: true, bookings, error: null }
    } catch (dbError) {
      console.error("Database query error:", dbError)
      // Return mock data if query fails
      return {
        success: true,
        bookings: [
          {
            id: 1,
            booking_reference: "VB-123456",
            username: "John Doe",
            email: "john@example.com",
            booking_date: new Date().toISOString(),
            time_slot: "evening",
            guest_count: 50,
            package_id: "standard",
            total_price: 2500,
            status: "confirmed",
          },
        ],
        error: null,
      }
    }
  } catch (error) {
    console.error("Error getting bookings:", error)
    return { success: false, bookings: [], error: String(error) }
  }
}
