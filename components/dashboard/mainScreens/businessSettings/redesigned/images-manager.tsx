"use client"

/**
 * Images manager (redesigned, Track C — interactive). Gallery upload/remove for a
 * business (BusinessesAPI.uploadImages → multipart → append to business.images via
 * update). Used inside the business-settings hub's Images tab. Own mutations;
 * invalidates the hub's biz query so the gallery refreshes.
 */

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showUndoToast } from "@/lib/toast/undo"
import { toast } from "sonner"

// Mirrors the server's multer config exactly (businessRouter.js "/upload-images":
// fileSize 10 MB, .array("images", 20), fileFilter mimetype image/*). Keep these
// in sync — if the client is looser the vendor gets a round-trip failure, and if
// it's stricter they're blocked from an upload the server would have accepted.
const MAX_BYTES = 10 * 1024 * 1024
const MAX_FILES = 20

/**
 * Remove-photo button: visible by default, hover-revealed only from md up.
 *
 * This was `opacity-0 ... group-hover:opacity-100`. :hover does not exist on a
 * touch screen, so on every phone and tablet the remove button was permanently
 * invisible and the vendor simply could not delete a photo — and most Pakistani
 * vendors run this dashboard on a phone. An unreachable control is a broken
 * feature, so touch now gets an always-visible button while pointer devices keep
 * the hover-reveal polish. Also bumped 7→8 (32px) to clear the 44px-ish minimum
 * comfortable tap target as closely as this tile size allows.
 */
const REMOVE_BTN_CLASS =
  "absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-md bg-black/55 text-white transition-opacity hover:bg-red-600 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"

/**
 * Turn a server/network error into something a venue owner can act on.
 *
 * The raw message was being piped straight to the toast, so picking a file that
 * wasn't really an image showed the vendor:
 *   Cloudinary 400: {"error":{"message":"Invalid image file"}}
 * That names our storage vendor, leaks the upstream response shape, and tells a
 * Pakistani venue owner nothing about what to do next. Known causes are mapped
 * to plain instructions; anything unrecognised falls back to a generic line
 * rather than echoing internals.
 */
function humanUploadError(e: any): string {
  const raw = String(e?.response?.data?.message ?? e?.message ?? "")
  if (/invalid image file|cloudinary/i.test(raw))
    return "That file isn't a valid image. Please upload a JPG, PNG or WebP photo."
  if (/under 10 ?MB|LIMIT_FILE_SIZE/i.test(raw)) return "Each photo must be under 10 MB."
  if (/Maximum 20 images|LIMIT_FILE_COUNT/i.test(raw)) return "You can upload 20 photos at a time."
  if (/Only image files/i.test(raw)) return "Only image files can be uploaded here."
  if (/Network Error|timeout/i.test(raw))
    return "Upload failed — check your internet connection and try again."
  return "Couldn't upload those photos. Please try again."
}

export function ImagesManager({ businessId, images }: { businessId: number; images: string[] }) {
  const qc = useQueryClient()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })

  // NOTE: both mutations rewrite the WHOLE images array, derived from the
  // `images` prop captured at render. That is last-write-wins — if the prop is
  // stale (a second tab, or a cached GET) an upload silently drops whatever it
  // didn't know about. Correcting it properly needs add/remove endpoints rather
  // than a full-array PATCH, so it is logged as a separate finding; this change
  // does not widen the window.
  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const urls = await BusinessesAPI.uploadImages(files, businessId)
      return BusinessesAPI.update(businessId, { images: [...images, ...urls] })
    },
    onSuccess: (_d, files) => {
      showSuccessToast(files.length === 1 ? "Photo uploaded" : `${files.length} photos uploaded`)
      invalidate()
    },
    onError: (e: any) => toast.error(humanUploadError(e)),
  })

  // Removal only drops the URL from this business's array — the file itself
  // stays in Cloudinary — so it is genuinely reversible. That makes an Undo
  // toast the right affordance: the delete button had NO confirmation of any
  // kind, so one stray tap destroyed a gallery photo with no way back.
  const removeMut = useMutation({
    mutationFn: (url: string) => BusinessesAPI.update(businessId, { images: images.filter((u) => u !== url) }),
    onSuccess: (_d, url) => {
      const restore = images
      showUndoToast({
        message: "Photo removed",
        onUndo: async () => {
          try {
            await BusinessesAPI.update(businessId, { images: restore })
            invalidate()
          } catch {
            toast.error("Couldn't restore that photo.")
          }
        },
      })
      invalidate()
    },
    onError: (e: any) => toast.error(humanUploadError(e)),
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    // Reset the input FIRST, before any early return. It was only reset on the
    // happy path, so picking a rejected file left the input holding it and
    // re-picking the same file fired no change event at all — the Upload button
    // looked dead.
    if (inputRef.current) inputRef.current.value = ""
    if (!files.length) return

    // Validate here rather than letting the server reject: the vendor gets an
    // instant, specific reason instead of a round trip that ends in an error.
    if (files.length > MAX_FILES) {
      toast.error(`You can upload ${MAX_FILES} photos at a time — you picked ${files.length}.`)
      return
    }
    const tooBig = files.find((f) => f.size > MAX_BYTES)
    if (tooBig) {
      toast.error(`"${tooBig.name}" is ${(tooBig.size / 1024 / 1024).toFixed(1)} MB. Each photo must be under 10 MB.`)
      return
    }
    // `accept="image/*"` is only a file-picker hint — it is not enforcement, and
    // drag-drop or "All files" bypasses it entirely.
    const notImage = files.find((f) => !f.type.startsWith("image/"))
    if (notImage) {
      toast.error(`"${notImage.name}" isn't an image. Please upload a JPG, PNG or WebP photo.`)
      return
    }

    uploadMut.mutate(files)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Image" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Images</h2><p className="text-xs text-muted-foreground">Your public gallery — couples see these first.</p></div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" disabled={uploadMut.isPending} onClick={() => inputRef.current?.click()}>
          {uploadMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Uploading…</> : <><Icon name="Upload" size={14} className="mr-1.5" /> Upload</>}
        </Button>
      </div>

      <div className="p-4">
        {!images.length ? (
          <EmptyState icon="Image" title="No images yet" description="Upload photos of your work so couples can see what you offer." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? "Cover photo" : `Gallery image ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeMut.mutate(src)}
                  disabled={removeMut.isPending}
                  aria-label="Remove image"
                  className={REMOVE_BTN_CLASS}
                >
                  <Icon name="Trash2" size={14} />
                </button>
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImagesManager
