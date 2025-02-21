import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

// Helper to get the vendor type from a business object
const getVendorType = (vendor: any) => vendor.vendorType || vendor.type || ""

export const fetchVendors = createAsyncThunk("vendors/fetchVendors", async () => {
  const response = await axios.get("http://localhost:3000/api/v1/businesses")
  
  return response.data.businesses || response.data || []
})

const vendorSlice = createSlice({
  name: "vendors",
  initialState: {
    all: [] as any[],
    weddingVenues: [] as any[],
    photographers: [] as any[],
    decorators: [] as any[],
    hennaArtists: [] as any[],
    makeupArtists: [] as any[],
    carRentals: [] as any[],
    catering: [] as any[],
    bridalWearings: [] as any[],
    invitations: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        // console.log("Main response: ", action.payload)
        state.all = action.payload
        state.weddingVenues = action.payload.filter((b: any) => getVendorType(b) === "Wedding venue")
        // console.log("Wedding Venues: ", state.weddingVenues)
        state.photographers = action.payload.filter((b: any) => getVendorType(b) === "Photographer")
        // console.log("Photographers: ", state.photographers)
        state.decorators = action.payload.filter((b: any) => getVendorType(b) === "Decorator")
        // console.log("Decorators: ", state.decorators)
        state.hennaArtists = action.payload.filter((b: any) => getVendorType(b) === "Henna artist")
        // console.log("Henna Artists: ", state.hennaArtists)
        state.makeupArtists = action.payload.filter((b: any) => getVendorType(b) === "Makeup artist")
        // console.log("Makeup Artists: ", state.makeupArtists)
        state.carRentals = action.payload.filter((b: any) => getVendorType(b) === "Car rental")
        // console.log("Car Rentals: ", state.carRentals)
        state.catering = action.payload.filter((b: any) => getVendorType(b) === "Catering")
        // console.log("Catering: ", state.catering)
        state.bridalWearings = action.payload.filter((b: any) => getVendorType(b) === "Bridal wearing")
        // console.log("Bridal Wearings: ", state.bridalWearings)
        state.invitations = action.payload.filter((b: any) => getVendorType(b) === "Wedding Invitations and Stationery")
        // console.log("Invitations: ", state.invitations)
        state.loading = false
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch vendors"
      })
  },
})

export default vendorSlice.reducer
