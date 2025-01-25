"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HeroSection() {
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")

  return (
    <section className="relative min-h-[600px] flex items-center">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1779414/pexels-photo-1779414.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Wedding couple"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      </div>

      <div className="relative container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Plan Your Perfect Wedding</h1>
          <p className="text-xl mb-8 text-gray-100">Find and book the best wedding vendors in your city</p>

          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-6">
              <Tabs defaultValue="vendors" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="vendors">Find Vendors</TabsTrigger>
                  <TabsTrigger value="venues">Find Venues</TabsTrigger>
                </TabsList>
                <TabsContent value="vendors">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photographers">Photographers</SelectItem>
                        <SelectItem value="makeup">Makeup Artists</SelectItem>
                        <SelectItem value="decorators">Decorators</SelectItem>
                        <SelectItem value="caterers">Caterers</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="text"
                      placeholder="Enter your city"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1"
                    />

                    <Button className="w-full md:w-auto" size="lg">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="venues">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Venue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banquet">Banquet Halls</SelectItem>
                        <SelectItem value="hotels">Hotels</SelectItem>
                        <SelectItem value="resorts">Resorts</SelectItem>
                        <SelectItem value="gardens">Gardens</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input type="text" placeholder="Enter your city" className="flex-1" />

                    <Button className="w-full md:w-auto" size="lg">
                      <Search className="w-4 h-4 mr-2" />
                      Search Venues
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

