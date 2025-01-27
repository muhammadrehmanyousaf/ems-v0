"use client"

import { Suspense } from "react"
import VendorsComponent from "@/components/vendors-component"

export default function VendorsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorsComponent />
    </Suspense>
  )
}

