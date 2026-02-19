"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { VendorPerformanceItem } from "@/lib/api/analytics";
import Link from "next/link";

interface TopVendorsTableProps {
  vendors: VendorPerformanceItem[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);

const TopVendorsTable: React.FC<TopVendorsTableProps> = ({ vendors }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Performing Vendors</CardTitle>
            <CardDescription>Ranked by total bookings this period</CardDescription>
          </div>
          <Link
            href="/dashboard/vendors"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {vendors.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No vendor data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-4 text-left font-medium">#</th>
                  <th className="py-2 pr-4 text-left font-medium">Vendor</th>
                  <th className="py-2 pr-4 text-left font-medium">Type</th>
                  <th className="py-2 pr-4 text-right font-medium">Bookings</th>
                  <th className="py-2 pr-4 text-right font-medium">Businesses</th>
                  <th className="py-2 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {vendors.slice(0, 10).map((vendor, i) => (
                  <tr
                    key={vendor.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-muted-foreground font-medium">
                      {i + 1}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {vendor.name?.charAt(0)?.toUpperCase() || "V"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {vendor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="capitalize text-xs">
                        {vendor.vendorType || "N/A"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                      {vendor.bookingCount}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {vendor.businessCount}
                    </td>
                    <td className="py-2.5 text-right">
                      {vendor.avgRating > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium tabular-nums">{vendor.avgRating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({vendor.reviewCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No reviews</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopVendorsTable;
