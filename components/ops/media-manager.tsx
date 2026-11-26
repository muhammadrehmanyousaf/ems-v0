"use client"

// Photos and videos for a staff-made listing: staff upload (with the "vendor says these are theirs" tick), removal, and a one-time link the
// vendor opens on their own phone. Every file is checked by the server (real type, size, scan); this screen reports what it refused and why.
import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Link2, MessageCircle, Trash2, UploadCloud } from "lucide-react"

import { Btn, Card, Check_, Chip, CopyButton, Empty, ErrorState, Modal, Notice, Seg, SkelRows, Status, cx, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { directoryOpsApi } from "@/lib/api/ops-directory"
import { UPLOAD_REASON, mediaApi, type MediaKind, type MediaLinkCreated, type UploadOutcome } from "@/lib/api/ops-onboarding"
import { uploadMessage, waLink } from "@/lib/ops/whatsapp"

const ACCEPT: Record<MediaKind, string> = { image: "image/jpeg,image/png,image/webp", logo: "image/jpeg,image/png,image/webp", video: "video/mp4,video/quicktime,video/webm" }

export function MediaManager({ listingId, businessName, ownerName, ownerPhone, onChanged, mode = "listing" }: {
  listingId: number; businessName: string; ownerName: string | null; ownerPhone: string | null; onChanged?: () => void; mode?: "listing" | "directory"
}) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const isDir = mode === "directory"
  const q = useQuery({
    queryKey: ["ops", isDir ? "directory-media" : "media", listingId],
    queryFn: () => (isDir ? directoryOpsApi.mediaList(listingId) : mediaApi.list(listingId)),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const [kind, setKind] = useState<MediaKind>("image")
  const [files, setFiles] = useState<File[]>([])
  const [rights, setRights] = useState(false)
  const [drag, setDrag] = useState(false)
  const [result, setResult] = useState<UploadOutcome | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [link, setLink] = useState<MediaLinkCreated | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["ops", isDir ? "directory-media" : "media", listingId] })
    qc.invalidateQueries({ queryKey: ["ops", "listing", listingId] })
    qc.invalidateQueries({ queryKey: ["ops", "vendor", listingId] })
    qc.invalidateQueries({ queryKey: ["ops", "vendors"] })
    onChanged?.()
  }

  const upload = useMutation({
    mutationFn: () => (isDir ? directoryOpsApi.mediaUpload(listingId, files, kind, rights) : mediaApi.upload(listingId, files, kind, rights)),
    onSuccess: (r) => { setResult(r); setFiles([]); if (input.current) input.current.value = ""; refresh(); if (r.added.length) toast({ title: `${r.added.length} uploaded` }) },
    onError: (e) => toast({ title: "Upload failed", body: opsErrorMessage(e), tone: "bad" }),
  })
  const remove = useMutation({
    mutationFn: (url: string) => (isDir ? directoryOpsApi.mediaRemove(listingId, url) : mediaApi.remove(listingId, url)),
    onSuccess: () => { setRemoving(null); refresh(); toast({ title: "Removed from the listing", body: "The file is kept and can be restored by an admin." }) },
    onError: (e) => toast({ title: "Could not remove", body: opsErrorMessage(e), tone: "bad" }),
  })
  const makeLink = useMutation({
    mutationFn: () => mediaApi.createLink(listingId),
    onSuccess: (l) => { setLink(l); refresh() },
    onError: (e) => toast({ title: "Could not create the link", body: opsErrorMessage(e), tone: "bad" }),
  })
  const revoke = useMutation({
    mutationFn: (id: number) => mediaApi.revokeLink(listingId, id),
    onSuccess: () => { refresh(); toast({ title: "Link revoked" }) },
    onError: (e) => toast({ title: "Could not revoke", body: opsErrorMessage(e), tone: "bad" }),
  })

  const pick = (list: FileList | File[] | null) => { if (list) { setFiles(Array.from(list).slice(0, 10)); setResult(null) } }

  if (q.isLoading) return <Card title="Photos and videos"><SkelRows rows={4} /></Card>
  if (q.isError || !q.data) return <Card title="Photos and videos"><ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /></Card>
  const m = q.data
  const total = m.images.length + m.videos.length + (m.brandLogo ? 1 : 0)
  const activeLinks = m.links.filter((l) => !l.revokedAt && new Date(l.expiresAt) > new Date())

  return (
    <>
      <Card title="Photos and videos" sub={`${m.images.length} of ${m.limits.images} photos · ${m.videos.length} of ${m.limits.videos} videos${m.brandLogo ? " · logo set" : ""}`}
        actions={!isDir ? <Btn size="sm" icon={<Link2 aria-hidden />} onClick={() => makeLink.mutate()} loading={makeLink.isPending}>Vendor upload link</Btn> : undefined}>
        {total === 0 ? (
          <Empty icon={<ImagePlus />} title="No photos yet">A listing needs at least one photo to go live. Upload what the vendor sent on WhatsApp, or send them an upload link so they can add their own.</Empty>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 10, marginBottom: 16 }}>
            {m.brandLogo ? <Tile url={m.brandLogo} label="Logo" onRemove={() => setRemoving(m.brandLogo)} /> : null}
            {m.images.map((u, i) => <Tile key={u} url={u} label={`Photo ${i + 1}`} onRemove={() => setRemoving(u)} />)}
            {m.videos.map((u, i) => <Tile key={u} url={u} label={`Video ${i + 1}`} video onRemove={() => setRemoving(u)} />)}
          </div>
        )}

        <div style={{ borderTop: total ? "1px solid var(--border)" : 0, paddingTop: total ? 16 : 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <Seg<MediaKind> label="What are you uploading" value={kind} onChange={(k) => { setKind(k); setFiles([]); setResult(null) }}
              options={[{ value: "image", label: "Photos" }, { value: "video", label: "Videos" }, { value: "logo", label: "Logo" }]} />
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }}
            style={{ border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong, var(--border))"}`, background: drag ? "var(--accent-wash)" : "var(--surface-2)", borderRadius: 12, padding: "22px 16px", textAlign: "center", transition: "background .12s, border-color .12s" }}
          >
            <UploadCloud size={22} aria-hidden style={{ color: "var(--accent)" }} />
            <p style={{ margin: "8px 0 2px", fontSize: 13, fontWeight: 600 }}>Drop {kind === "video" ? "videos" : kind === "logo" ? "the logo" : "photos"} here</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>{kind === "video" ? "MP4, MOV or WebM, up to 50 MB each" : "JPG, PNG or WebP, at least 400 px on each side"} · up to 10 files at a time</p>
            <div style={{ marginTop: 12 }}>
              <input ref={input} id={`media-input-${listingId}`} type="file" hidden multiple={kind !== "logo"} accept={ACCEPT[kind]} onChange={(e) => pick(e.target.files)} />
              <Btn size="sm" onClick={() => input.current?.click()}>Choose files</Btn>
            </div>
          </div>

          {files.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{files.map((f) => <Chip key={f.name + f.size} on>{f.name}</Chip>)}</div>
              <Check_ checked={rights} onChange={setRights}>The vendor confirmed these are their own photos and videos and we may show them on their listing.</Check_>
              <div style={{ marginTop: 12 }}><Btn variant="primary" loading={upload.isPending} disabled={!rights} onClick={() => upload.mutate()}>Upload {files.length} file{files.length === 1 ? "" : "s"}</Btn></div>
            </div>
          ) : null}

          {result ? (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {result.added.length ? <Notice tone="ok">{result.added.length} file{result.added.length === 1 ? "" : "s"} added to the listing.</Notice> : null}
              {result.failed.length ? <Notice tone="warn"><strong>{result.failed.length} could not be added:</strong><ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{result.failed.map((f, i) => <li key={i}>{f.name ?? "A file"}: {UPLOAD_REASON[f.reason] ?? "Could not be used"}</li>)}</ul></Notice> : null}
            </div>
          ) : null}
        </div>

        {m.links.length ? (
          <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 600 }}>Vendor upload links</p>
            {m.links.map((l) => {
              const live = !l.revokedAt && new Date(l.expiresAt) > new Date()
              return (
                <div key={l.id} className="list-row" style={{ padding: "8px 0" }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                    <div>{live ? <Status tone="ok">Active</Status> : <Status tone="mut">{l.revokedAt ? "Revoked" : "Expired"}</Status>}</div>
                    <div style={{ color: "var(--ink-3)", marginTop: 2 }}>{l.uploadsCount} of {l.maxUploads} uploads used · {live ? `expires ${fmtWhen(l.expiresAt)}` : `created ${fmtWhen(l.createdAt)}`}</div>
                  </div>
                  {live ? <Btn size="sm" variant="danger" loading={revoke.isPending && revoke.variables === l.id} onClick={() => revoke.mutate(l.id)}>Revoke</Btn> : null}
                </div>
              )
            })}
            {!activeLinks.length ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-3)" }}>No active link. Create one to let the vendor upload from their phone.</p> : null}
          </div>
        ) : null}
      </Card>

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="Remove this file from the listing?" description="It disappears from the public page. The file itself is kept, so an admin can restore it."
        footer={<><Btn onClick={() => setRemoving(null)}>Keep it</Btn><Btn variant="danger" loading={remove.isPending} onClick={() => removing && remove.mutate(removing)}>Remove</Btn></>} />

      <Modal open={!!link} onClose={() => setLink(null)} title="Vendor upload link" description="Shown once. Send it to the owner; it works for 72 hours and only adds photos and videos to this listing."
        footer={<><Btn onClick={() => setLink(null)}>Done</Btn>
          {link ? <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={waLink(ownerPhone, uploadMessage({ ownerName, businessName, url: link.url, hours: link.hours }))}><MessageCircle aria-hidden size={15} />Send on WhatsApp</a> : null}</>}>
        {link ? (
          <div style={{ display: "grid", gap: 10 }}>
            <input className="inp" readOnly value={link.url} aria-label="Upload link" onFocus={(e) => e.currentTarget.select()} />
            <div><CopyButton text={link.url} label="Copy link" /></div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

function Tile({ url, label, video, onRemove }: { url: string; label: string; video?: boolean; onRemove: () => void }) {
  return (
    <figure style={{ margin: 0, position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-3)", aspectRatio: "1 / 1" }}>
      {video
        ? <video src={url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} aria-label={label} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={url} alt={label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      <figcaption style={{ position: "absolute", left: 6, bottom: 6, fontSize: 11, fontWeight: 600, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{label}</figcaption>
      <button type="button" aria-label={`Remove ${label}`} className={cx("ibtn")} onClick={onRemove}
        style={{ position: "absolute", top: 4, right: 4, background: "rgba(255,255,255,.92)", width: 28, height: 28 }}><Trash2 size={14} aria-hidden /></button>
    </figure>
  )
}
