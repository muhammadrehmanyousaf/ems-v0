"use client";
import React, { useCallback, useEffect, useState } from "react";
import VendorTableActions from "./vendor-table-actions";
import { GlobalTable } from "@/components/dashboard/globalComponents/globalTable/global-table";
import { useDataTable } from "@/components/dashboard/globalComponents/globalTable/components/use-data-table";
import { Vendor } from "@/lib/dashboard-types";
import { columns } from "./columns";
import { VendorsAPI, UsersAPI } from "@/lib/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { EditVendorDialog } from "./edit-vendor-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/globalComponents/confirm-delete-dialog";
import { toast } from "sonner";

const VendorsTable = () => {
  const [data, setData] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    VendorsAPI.getAll()
      .then((vendors) => {
        const mapped: Vendor[] = vendors.map((v) => ({
          id: v.id,
          fullName: v.fullName,
          email: v.email,
          phoneNumber: v.phoneNumber,
          vendorType: v.vendorType || "",
          status: v.active ? "Active" : "Inactive",
          active: v.active,
          reviewProfile: v.reviewProfile,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        }));
        setData(mapped);
      })
      .catch(() => {
        setData([]);
        toast.error("Failed to load vendors");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteVendor) return;
    try {
      await UsersAPI.delete(Number(deleteVendor.id));
      toast.success("Vendor deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete vendor");
    }
  };

  const { table, paginationState } = useDataTable<Vendor>({
    data,
    columns: columns(
      (vendor) => setEditVendor(vendor),
      (vendor) => setDeleteVendor(vendor),
    ),
    totalItems: data.length,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VendorTableActions table={table} />
      <GlobalTable
        table={table}
        paginationState={paginationState}
        totalItems={data.length}
      />

      <EditVendorDialog
        open={!!editVendor}
        onOpenChange={(v) => !v && setEditVendor(null)}
        vendor={editVendor}
        onSuccess={fetchData}
      />

      <ConfirmDeleteDialog
        open={!!deleteVendor}
        onOpenChange={(v) => !v && setDeleteVendor(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deleteVendor?.fullName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default VendorsTable;
