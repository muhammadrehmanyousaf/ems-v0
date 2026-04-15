"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PackagesAPI, BusinessesAPI, type ApiPackage } from "@/lib/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Package, Trash2, Pencil, Loader2, X, ImagePlus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Package Image Editor ─────────────────────────────────────────────────────

function PackageImageEditor({
  existingImages,
  newFiles,
  onRemoveExisting,
  onNewFilesChange,
}: {
  existingImages: string[];
  newFiles: File[];
  onRemoveExisting: (url: string) => void;
  onNewFilesChange: (files: File[]) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onNewFilesChange([...newFiles, ...acceptedFiles]);
    },
    [newFiles, onNewFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    multiple: true,
  });

  const removeNewFile = (index: number) => {
    onNewFilesChange(newFiles.filter((_, i) => i !== index));
  };

  const hasImages = existingImages.length > 0 || newFiles.length > 0;

  return (
    <div className="space-y-3">
      <Label>Vehicle Images</Label>

      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {existingImages.map((url) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
              <img src={url} alt="Package" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New files preview */}
      {newFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {newFiles.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-violet-200 shadow-sm">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <X size={11} />
              </button>
              <span className="absolute bottom-1 left-1 bg-violet-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">New</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 px-4 py-5 text-center
          ${isDragActive
            ? "border-violet-500 bg-violet-50"
            : "border-neutral-300 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50/40"
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1.5">
          {isDragActive ? (
            <>
              <Upload className="size-6 text-violet-500" />
              <p className="text-sm font-medium text-violet-600">Drop images here</p>
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-neutral-400" />
              <p className="text-sm text-neutral-600">
                {hasImages ? "Add more images" : "Upload vehicle images"}
              </p>
              <p className="text-xs text-neutral-400">Drag & drop or click · JPG, PNG</p>
            </>
          )}
        </div>
      </div>

      {hasImages && (
        <p className="text-xs text-neutral-400">
          {existingImages.length} saved · {newFiles.length} new · hover to remove
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState<ApiPackage | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: 0, features: "", images: [] as string[] });
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchPackages = async () => {
    try {
      const businesses = await BusinessesAPI.getUserBusinesses();
      if (businesses.length > 0) {
        const allPkgs = await Promise.all(
          businesses.map((b) => PackagesAPI.getAll(b.id))
        );
        setPackages(allPkgs.flat());
      } else {
        const all = await PackagesAPI.getAll();
        setPackages(all);
      }
    } catch {
      setPackages([]);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await PackagesAPI.delete(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package deleted");
    } catch {
      toast.error("Failed to delete package");
    }
  };

  const openEdit = (pkg: ApiPackage) => {
    setEditingPkg(pkg);
    setEditForm({
      name: pkg.name,
      price: pkg.price,
      features: (pkg.features || []).join("\n"),
      images: pkg.images || [],
    });
    setNewImageFiles([]);
  };

  const handleSaveEdit = async () => {
    if (!editingPkg) return;
    setSaving(true);
    try {
      const features = editForm.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      let finalImages = [...editForm.images];
      if (newImageFiles.length > 0) {
        const uploaded = await PackagesAPI.uploadImages(newImageFiles, editingPkg.businessId);
        finalImages = [...finalImages, ...uploaded];
      }

      const updated = await PackagesAPI.update(editingPkg.id, {
        name: editForm.name,
        price: editForm.price,
        features,
        images: finalImages,
        businessId: editingPkg.businessId,
      });
      setPackages((prev) =>
        prev.map((p) => (p.id === editingPkg.id ? { ...p, ...updated } : p))
      );
      toast.success("Package updated");
      setEditingPkg(null);
      setNewImageFiles([]);
    } catch {
      toast.error("Failed to update package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Packages</h1>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No packages yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create packages from your business settings to start offering services.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">{pkg.name}</CardTitle>
                  {pkg.business && (
                    <Badge variant="outline" className="text-xs">
                      {pkg.business.name}
                    </Badge>
                  )}
                </div>
                {pkg.description && (
                  <CardDescription>{pkg.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-2xl font-bold mb-4">
                  Rs. {pkg.price?.toLocaleString()}
                </p>
                {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(pkg)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Package Dialog */}
      <Dialog open={!!editingPkg} onOpenChange={(open) => { if (!open) { setEditingPkg(null); setNewImageFiles([]); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Update the package details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (Rs.)</Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-features">Features (one per line)</Label>
              <Textarea
                id="edit-features"
                rows={4}
                value={editForm.features}
                onChange={(e) => setEditForm((f) => ({ ...f, features: e.target.value }))}
                placeholder={"Feature 1\nFeature 2\nFeature 3"}
              />
            </div>

            {/* Images Section */}
            <PackageImageEditor
              existingImages={editForm.images}
              newFiles={newImageFiles}
              onRemoveExisting={(url) =>
                setEditForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }))
              }
              onNewFilesChange={setNewImageFiles}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPkg(null); setNewImageFiles([]); }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editForm.name}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
