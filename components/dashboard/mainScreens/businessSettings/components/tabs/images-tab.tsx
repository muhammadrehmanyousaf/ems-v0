'use client';

import { useState, useRef } from 'react';
import { BusinessesAPI, type ApiBusiness } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/dashboard/globalComponents/confirm-delete-dialog';
import { getImageUrl } from '@/lib/utils/image-utils';
import Image from 'next/image';

interface ImagesTabProps {
    business: ApiBusiness;
    onSuccess: () => void;
}

const ImagesTab = ({ business, onSuccess }: ImagesTabProps) => {
    const [images, setImages] = useState<string[]>(business.images || []);
    const [uploading, setUploading] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const maxFiles = 20 - images.length;
        if (fileArray.length > maxFiles) {
            toast.error(`You can upload up to ${maxFiles} more images (max 20 total).`);
            return;
        }

        setUploading(true);
        try {
            const uploadedUrls = await BusinessesAPI.uploadImages(fileArray, Number(business.id));
            const updatedImages = [...images, ...uploadedUrls];
            await BusinessesAPI.update(business.id, { images: updatedImages });
            setImages(updatedImages);
            toast.success(`${uploadedUrls.length} image(s) uploaded`);
            onSuccess();
        } catch {
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (deleteIndex === null) return;
        const updatedImages = images.filter((_, i) => i !== deleteIndex);
        try {
            await BusinessesAPI.update(business.id, { images: updatedImages });
            setImages(updatedImages);
            toast.success('Image removed');
            onSuccess();
        } catch {
            toast.error('Failed to remove image');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Images</h3>
                    <Badge variant="secondary">{images.length} / 20</Badge>
                </div>
                <Button
                    size="sm"
                    disabled={uploading || images.length >= 20}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {uploading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4 mr-1" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Images'}
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                />
            </div>

            {images.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/20 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="h-12 w-12 text-muted-foreground mb-3" />
                    <h4 className="font-medium">No images yet</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Upload photos to showcase your business to customers. You can add up to 20 images.
                    </p>
                    <Button size="sm" className="mt-4" disabled={uploading}>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload First Image
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                        >
                            <Image
                                src={getImageUrl(img)}
                                alt={`Business image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            {index === 0 && (
                                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                                    Cover
                                </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setDeleteIndex(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Upload more card */}
                    {images.length < 20 && (
                        <div
                            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Add More</span>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDeleteDialog
                open={deleteIndex !== null}
                onOpenChange={(v) => { if (!v) setDeleteIndex(null); }}
                title="Remove Image"
                description="Are you sure you want to remove this image? This action cannot be undone."
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default ImagesTab;
