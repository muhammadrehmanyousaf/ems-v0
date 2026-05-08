"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check,
  Package,
  Trash2,
  Pencil,
  Loader2,
  X,
  ImagePlus,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PackagesAPI, BusinessesAPI, type ApiPackage } from "@/lib/api/dashboard";

import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "@/components/user-dashboard";

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
    [newFiles, onNewFilesChange],
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
      <Label className="text-[11.5px] font-medium">Package images</Label>

      {existingImages.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {existingImages.map((url) => (
            <div
              key={url}
              className="relative group aspect-square rounded-md overflow-hidden border border-border"
            >
              <Image
                src={url}
                alt="Package"
                fill
                sizes="(min-width: 1024px) 200px, 33vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-bridal-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute top-1.5 right-1.5 bg-bridal-coral hover:bg-bridal-coral/90 text-bridal-ivory rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {newFiles.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {newFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="relative group aspect-square rounded-md overflow-hidden border border-bridal-gold/45"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-bridal-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute top-1.5 right-1.5 bg-bridal-coral hover:bg-bridal-coral/90 text-bridal-ivory rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
              <span className="absolute bottom-1 left-1 bg-bridal-gold border border-bridal-gold-dark text-bridal-charcoal text-[9px] font-medium uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full">
                New
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md cursor-pointer transition-all px-4 py-6 text-center",
          isDragActive
            ? "border-bridal-gold bg-bridal-cream"
            : "border-border bg-muted/30 hover:border-bridal-gold/55 hover:bg-bridal-cream/40",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1.5">
          {isDragActive ? (
            <>
              <Upload className="size-6 text-bridal-gold-dark" />
              <p className="text-[13px] font-medium text-bridal-gold-dark">
                Drop images here
              </p>
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-muted-foreground" />
              <p className="text-[13px] text-foreground/85">
                {hasImages ? "Add more images" : "Upload package images"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Drag &amp; drop or click · JPG, PNG
              </p>
            </>
          )}
        </div>
      </div>

      {hasImages ? (
        <p className="text-[11px] text-muted-foreground">
          {existingImages.length} saved · {newFiles.length} new · hover to remove
        </p>
      ) : null}
    </div>
  );
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState<ApiPackage | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    features: "",
    images: [] as string[],
  });
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchPackages = async () => {
    try {
      const businesses = await BusinessesAPI.getUserBusinesses();
      if (businesses.length > 0) {
        const allPkgs = await Promise.all(
          businesses.map((b) => PackagesAPI.getAll(b.id)),
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
      features: ((pkg.features as unknown[]) || []).map(String).join("\n"),
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
        const uploaded = await PackagesAPI.uploadImages(
          newImageFiles,
          editingPkg.businessId,
        );
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
        prev.map((p) => (p.id === editingPkg.id ? { ...p, ...updated } : p)),
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

  const eyebrow = (
    <>
      <span>Console</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Packages</span>
    </>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Packages"
        description="Service packages you offer to customers."
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No packages yet"
          description="Create packages from your business settings to start offering services."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
            >
              {Array.isArray(pkg.images) && pkg.images.length > 0 ? (
                <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                  <Image
                    src={pkg.images[0]}
                    alt={pkg.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  {pkg.images.length > 1 ? (
                    <span className="absolute bottom-2 right-2 rounded-full bg-bridal-charcoal/80 backdrop-blur text-bridal-ivory text-[10px] font-medium uppercase tracking-[0.18em] px-2.5 py-1">
                      +{pkg.images.length - 1} photos
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display italic text-[18px] text-foreground capitalize leading-tight">
                    {pkg.name}
                  </h3>
                  {pkg.business ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground shrink-0">
                      {pkg.business.name}
                    </span>
                  ) : null}
                </div>
                {pkg.description ? (
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                    {pkg.description}
                  </p>
                ) : null}
                <p className="font-display italic text-[26px] text-bridal-gold-dark tabular-nums my-3 leading-none">
                  Rs. {pkg.price?.toLocaleString()}
                </p>
                {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                  <ul className="space-y-1.5 flex-1">
                    {pkg.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-[12.5px] text-foreground/85"
                      >
                        <Check className="size-3.5 text-[#3F6B43] mt-0.5 shrink-0" />
                        <span>{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex justify-between gap-2 border-t border-border/60 bg-muted/20 px-5 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(pkg)}
                  className="gap-1.5"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pkg.id)}
                  className="gap-1.5 border-bridal-coral/30 text-bridal-coral hover:bg-bridal-coral/10 hover:text-bridal-coral hover:border-bridal-coral/45"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Package Dialog */}
      <Dialog
        open={!!editingPkg}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPkg(null);
            setNewImageFiles([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display italic text-[22px]">
              Edit package
            </DialogTitle>
            <DialogDescription>Update the package details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-[11.5px] font-medium"
              >
                Name
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-price"
                className="text-[11.5px] font-medium"
              >
                Price (Rs.)
              </Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    price: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-features"
                className="text-[11.5px] font-medium"
              >
                Features (one per line)
              </Label>
              <Textarea
                id="edit-features"
                rows={4}
                value={editForm.features}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, features: e.target.value }))
                }
                placeholder={"Feature 1\nFeature 2\nFeature 3"}
              />
            </div>

            <PackageImageEditor
              existingImages={editForm.images}
              newFiles={newImageFiles}
              onRemoveExisting={(url) =>
                setEditForm((f) => ({
                  ...f,
                  images: f.images.filter((img) => img !== url),
                }))
              }
              onNewFilesChange={setNewImageFiles}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingPkg(null);
                setNewImageFiles([]);
              }}
              disabled={saving}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editForm.name}
              size="sm"
              className="gap-1.5"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
