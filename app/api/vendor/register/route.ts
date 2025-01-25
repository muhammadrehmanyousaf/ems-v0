import { NextResponse } from "next/server"

// Temporary in-memory storage for vendors
const vendors: any[] = []

export async function POST(request: Request) {
  const { name, description, category, location, price } = await request.json()

  const newVendor = {
    id: Date.now().toString(),
    name,
    description,
    category,
    location,
    price,
  }

  vendors.push(newVendor)

  return NextResponse.json(newVendor)
}

export async function GET() {
  return NextResponse.json(vendors)
}

